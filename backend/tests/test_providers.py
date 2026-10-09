import pytest
from app.providers import OpenLibrary,GoogleBooks,LibriVox,InternetArchive
from app.providers.contracts import Candidate,Rendition
from app.normalisation import compare

class HTTP:
    def __init__(self,values):self.values=values
    async def get(self,url):
        for needle,value in self.values.items():
            if needle in url:return value
        raise AssertionError(url)

@pytest.mark.asyncio
async def test_openlibrary_search_and_work():
    p=OpenLibrary(HTTP({"search.json":{"docs":[{"key":"/works/OL123W","title":"Dune","author_name":["Frank Herbert"],"isbn":["9780441172719"]}]},"works/OL123W.json":{"title":"Dune","description":{"value":"Science fiction"},"covers":[12]}}))
    found=await p.search("Dune")
    assert found[0].identifiers["isbn13"]==["9780441172719"]
    assert (await p.get("OL123W")).description=="Science fiction"

@pytest.mark.asyncio
async def test_googlebooks_metadata():
    p=GoogleBooks(HTTP({"volumes?q=":{"items":[{"id":"g1","volumeInfo":{"title":"Dune","authors":["Frank Herbert"]}}]},"volumes/g1":{"id":"g1","volumeInfo":{"title":"Dune","industryIdentifiers":[{"type":"ISBN_13","identifier":"9780441172719"}]}}}))
    assert (await p.search("Dune"))[0].external_id=="g1"
    assert (await p.get("g1")).identifiers["isbn13"]==["9780441172719"]

@pytest.mark.asyncio
async def test_librivox_rendition_archive_relation():
    p=LibriVox(HTTP({"title/":{"books":[{"id":"8","title":"Test","url_iarchive":"https://archive.org/details/testbook","sections":[{"id":"1","playtime":"15","readers":[{"display_name":"Jane"}]}]}]}}))
    result=await p.find_renditions("Test",[])
    assert result[0].asset_refs==[("internetarchive","testbook")]
    assert result[0].chapters[0]["startSec"]==0

@pytest.mark.asyncio
async def test_archive_only_audio_files():
    p=InternetArchive(HTTP({"metadata/":{"files":[{"name":"book_archive.torrent"},{"name":"c1.mp3","size":"100","sha1":"abc"}]}}))
    r=Rendition("librivox","8","Test",[],"en",[],None,[],[("internetarchive","test")],"public-domain")
    assets=await p.resolve_assets(r)
    assert {a.kind for a in assets}=={"https","torrent"}
    assert all(a.rights_status=="public-domain" for a in assets)

def test_matching_requires_evidence():
    a=Candidate("openlibrary","1","Dune",["Frank Herbert"])
    b=Candidate("googlebooks","2","Dune",["Frank Herbert"])
    c=Candidate("other","3","Dune",["Someone Else"])
    assert compare(a,b).decision=="candidate"
    assert compare(a,c).decision=="review"
    assert compare(a,Candidate("x","4","Dune",[])).decision=="review"
