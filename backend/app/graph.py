"""Idempotent outbox consumer. PostgreSQL remains authoritative for social writes."""
import asyncio
from datetime import datetime, timezone
from neo4j import AsyncGraphDatabase
from sqlalchemy import select
from .config import settings
from .db import SessionLocal
from .models import OutboxEvent

async def apply_event(tx, topic: str, data: dict):
    if topic in ("social.followed", "social.unfollowed"):
        statement = (
            "MERGE (a:User {id:$from_id}) MERGE (b:User {id:$to_id}) "
            + ("MERGE (a)-[:FOLLOWS]->(b)" if topic == "social.followed"
               else "WITH a,b MATCH (a)-[r:FOLLOWS]->(b) DELETE r")
        )
        await tx.run(statement, from_id=data["follower_id"], to_id=data["followed_id"])
    elif topic == "library.saved":
        await tx.run(
            "MERGE (a:User {id:$user_id}) MERGE (b:Book {id:$book_id}) "
            "MERGE (a)-[:SAVED]->(b)", **data)
    elif topic == "social.event" and data.get("book_id"):
        await tx.run(
            "MERGE (a:User {id:$actor_id}) MERGE (b:Book {id:$book_id}) "
            "MERGE (a)-[:ENGAGED_WITH]->(b)",
            actor_id=data["actor_id"], book_id=data["book_id"])

async def project_once(driver) -> int:
    processed = 0
    async with SessionLocal() as db:
        async with db.begin():
            rows = (await db.scalars(
                select(OutboxEvent).where(OutboxEvent.delivered_at.is_(None))
                .order_by(OutboxEvent.created_at, OutboxEvent.id)
                .with_for_update(skip_locked=True).limit(100)
            )).all()
            async with driver.session() as graph:
                for event in rows:
                    await graph.execute_write(apply_event, event.topic, event.payload)
                    event.delivered_at = datetime.now(timezone.utc)
                    processed += 1
    return processed

async def main():
    driver = AsyncGraphDatabase.driver(settings.neo4j_uri, auth=(
        settings.neo4j_user, settings.neo4j_password))
    try:
        async with driver.session() as graph:
            await graph.run("CREATE CONSTRAINT user_id IF NOT EXISTS FOR (u:User) REQUIRE u.id IS UNIQUE")
            await graph.run("CREATE CONSTRAINT book_id IF NOT EXISTS FOR (b:Book) REQUIRE b.id IS UNIQUE")
        while True:
            try:
                count = await project_once(driver)
                if not count:
                    await asyncio.sleep(2)
            except Exception:
                # Transaction remains pending, so retry is safe after recovery.
                await asyncio.sleep(5)
    finally:
        await driver.close()

if __name__ == "__main__":
    asyncio.run(main())
