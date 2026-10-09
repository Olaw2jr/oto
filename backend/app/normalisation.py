"""Identity-first matching; ambiguous books require editorial review."""
import re
import unicodedata
from dataclasses import dataclass
from difflib import SequenceMatcher
from .providers.contracts import Candidate

def norm(text: str) -> str:
    text=unicodedata.normalize("NFKC",text).casefold()
    return " ".join(re.findall(r"[^\W_]+",text,flags=re.UNICODE))

def identifiers(candidate: Candidate) -> set[tuple[str,str]]:
    return {(scheme.lower(),re.sub(r"[^0-9X]", "",value.upper()) if scheme.lower().startswith("isbn") else value.strip())
            for scheme,values in candidate.identifiers.items() for value in values if value.strip()}

@dataclass(frozen=True)
class Match:
    decision: str
    score: float
    reasons: tuple[str,...]

def compare(a: Candidate,b: Candidate) -> Match:
    a_ids,b_ids=identifiers(a),identifiers(b)
    shared=a_ids & b_ids
    # IDs are edition-sensitive. Matching ISBNs is evidence but not a
    # substitute for work-level matching and review when metadata conflicts.
    if shared:
        return Match("candidate",0.98,("shared-identifier",))
    title=SequenceMatcher(None,norm(a.title),norm(b.title)).ratio()
    authors_a={norm(x) for x in a.authors if norm(x)}
    authors_b={norm(x) for x in b.authors if norm(x)}
    if not authors_a or not authors_b:
        return Match("review" if title>=0.93 else "distinct",title,("missing-author-evidence",))
    author=bool(authors_a & authors_b)
    if title>=0.96 and author:
        return Match("candidate",round((title+1)/2,3),("title-and-author",))
    if title>=0.85:
        return Match("review",round((title+int(author))/2,3),("ambiguous-work",))
    return Match("distinct",title,("weak-title",))
