"""Python ports of Oto's TypeScript provider adapters; injected HTTP for fixture tests."""
import re
from urllib.parse import quote, urlencode, urlsplit
import httpx
from .contracts import Candidate, BookRecord, Rendition, Asset

def isbns(values):
    result = {}
    for raw in values or []:
        token = re.sub(r"[^0-9Xx]", "", raw).upper()
        if len(token) in (10, 13):
            result.setdefault(f"isbn{len(token)}", []).append(token)
    return result

def _field(value):
    if isinstance(value, dict):
        return value.get("value")
    return value

class JSONClient:
    def __init__(self, user_agent="Oto/0.1 (catalogue metadata)", timeout=10):
        self.user_agent, self.timeout = user_agent, timeout
    async def get(self, url):
        async with httpx.AsyncClient(timeout=self.timeout, follow_redirects=False) as client:
            resp = await client.get(url, headers={"User-Agent": self.user_agent})
            resp.raise_for_status()
            if len(resp.content) > 5_000_000:
                raise ValueError("Provider response exceeds limit")
            return resp.json()

class OpenLibrary:
    id = "openlibrary"
    def __init__(self, http=None, base="https://openlibrary.org"):
        self.http, self.base = http or JSONClient(), base.rstrip("/")
    async def search(self, query, limit=20):
        params = urlencode({"q":query,"fields":"key,title,author_name,isbn","limit":max(1,min(limit,100))})
        data = await self.http.get(f"{self.base}/search.json?{params}")
        return [Candidate(self.id, row["key"].split("/")[-1], row["title"],
                          row.get("author_name", []),
                          {**isbns(row.get("isbn", [])),
                           "openLibraryWorkId":[row["key"].split("/")[-1]]})
                for row in data.get("docs",[]) if row.get("key") and row.get("title")]
    async def get(self, external_id):
        if not re.fullmatch(r"OL[0-9]+W",external_id): return None
        row = await self.http.get(f"{self.base}/works/{quote(external_id)}.json")
        if not row.get("title"): return None
        cover = (row.get("covers") or [None])[0]
        return BookRecord(self.id,external_id,row["title"],[],
            {"openLibraryWorkId":[external_id]},description=_field(row.get("description")),
            subjects=row.get("subjects",[]),published_at=row.get("first_publish_date"),
            cover_url=f"https://covers.openlibrary.org/b/id/{cover}-L.jpg" if cover else None,
            provenance={"provider":self.id,"external_id":external_id})

class GoogleBooks:
    id = "googlebooks"
    def __init__(self,http=None,base="https://www.googleapis.com/books/v1",api_key=None):
        self.http,self.base,self.key = http or JSONClient(),base.rstrip("/"),api_key
    def _url(self,path,params=None):
        p=dict(params or {})
        if self.key:p["key"]=self.key
        return f"{self.base}/{path}"+ (f"?{urlencode(p)}" if p else "")
    def _ids(self,volume):
        ids={"googleBooksVolumeId":[volume["id"]]}
        for field in volume.get("volumeInfo",{}).get("industryIdentifiers",[]):
            if field.get("type") in ("ISBN_10","ISBN_13") and field.get("identifier"):
                ids.setdefault(field["type"].lower().replace("_",""),[]).append(field["identifier"])
        return ids
    async def search(self,query,limit=20):
        data=await self.http.get(self._url("volumes",{"q":query,"maxResults":max(1,min(limit,40)),"printType":"books"}))
        return [Candidate(self.id,item["id"],item["volumeInfo"]["title"],
                          item["volumeInfo"].get("authors",[]),self._ids(item))
                for item in data.get("items",[]) if item.get("id") and item.get("volumeInfo",{}).get("title")]
    async def get(self,external_id):
        row=await self.http.get(self._url("volumes/"+quote(external_id,safe="")))
        info=row.get("volumeInfo",{})
        if not info.get("title"):return None
        row["id"]=row.get("id",external_id)
        image=info.get("imageLinks",{})
        return BookRecord(self.id,row["id"],info["title"],info.get("authors",[]),self._ids(row),
                          subtitle=info.get("subtitle"),description=info.get("description"),
                          subjects=info.get("categories",[]),publisher=info.get("publisher"),
                          published_at=info.get("publishedDate"),language=info.get("language"),
                          cover_url=image.get("thumbnail") or image.get("smallThumbnail"),
                          provenance={"provider":self.id,"external_id":row["id"]})

class LibriVox:
    id="librivox"
    def __init__(self,http=None,base="https://librivox.org/api/feed/audiobooks"):
        self.http,self.base=http or JSONClient(),base.rstrip("/")
    async def find_renditions(self,title,authors):
        data=await self.http.get(f"{self.base}/title/{quote(title,safe='')}?format=json&extended=1")
        result=[]
        for row in data.get("books",[]):
            if not row.get("id") or not row.get("title"):continue
            narrators=set()
            chapters=[]
            start=0
            for n,part in enumerate(row.get("sections",[])):
                length=int(float(part.get("playtime") or 0))
                chapters.append({"id":part.get("id") or f"{row['id']}-{n+1}",
                                 "title":part.get("title") or f"Chapter {n+1}",
                                 "startSec":start,"durationSec":length})
                start+=length
                narrators.update(r["display_name"] for r in part.get("readers",[]) if r.get("display_name"))
            ref=[]
            archive=re.search(r"archive\.org/(?:details|download)/([^/?#]+)",row.get("url_iarchive") or "")
            if archive:ref.append(("internetarchive",archive.group(1)))
            result.append(Rendition(self.id,str(row["id"]),row["title"],
                  [" ".join(filter(None,[a.get("first_name"),a.get("last_name")])) for a in row.get("authors",[])],
                  row.get("language") or "unknown",sorted(narrators),
                  int(row["totaltimesecs"]) if row.get("totaltimesecs") else None,
                  chapters,ref,"public-domain"))
        return result

class InternetArchive:
    id="internetarchive"
    def __init__(self,http=None,base="https://archive.org"):
        self.http,self.base=http or JSONClient(),base.rstrip("/")
    async def resolve_assets(self,rendition):
        assets=[]
        for provider,identifier in rendition.asset_refs:
            if provider!=self.id or not identifier:continue
            data=await self.http.get(f"{self.base}/metadata/{quote(identifier,safe='')}")
            files=data.get("files",[])
            torrent=next((f["name"] for f in files if f.get("name","").lower().endswith("_archive.torrent")),None)
            for file in files:
                name=file.get("name","")
                fmt=name.rsplit(".",1)[-1].lower()
                if fmt not in ("mp3","m4b","aac","opus"):continue
                uri=f"{self.base}/download/{quote(identifier,safe='')}/"+"/".join(quote(s,safe="") for s in name.split("/"))
                # Preserve rights from rendition, never infer rights from Archive hosting.
                assets.append(Asset(self.id,f"{identifier}/{name}",fmt,"https",uri,
                    file_path=name,size_bytes=int(file["size"]) if file.get("size") else None,
                    checksum=file.get("sha1") or file.get("md5"),rights_status=rendition.rights_status))
                if torrent:
                    torrent_uri=f"{self.base}/download/{quote(identifier,safe='')}/"+quote(torrent,safe="")
                    assets.append(Asset(self.id,f"{identifier}/{name}:torrent",fmt,"torrent",
                        torrent_uri,file_path=name,size_bytes=int(file["size"]) if file.get("size") else None,
                        rights_status=rendition.rights_status))
        return assets
