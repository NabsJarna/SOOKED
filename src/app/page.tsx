"use client";
import { useEffect, useState } from "react";

const MINT = "#2ECC9A";
const DARK = "#162220";
const GRAY = "#7A948E";

export default function Home() {
  const [listings, setListings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("Tout");
  const CATS = ["Tout","Vestes","Robes","Chaussures","Sacs","Hauts","Manteaux"];

  useEffect(() => { fetchListings(); }, [category]);

  async function fetchListings() {
    setLoading(true);
    const params = new URLSearchParams();
    if (category !== "Tout") params.set("category", category);
    if (search) params.set("search", search);
    const res = await fetch("/api/listings?" + params);
    const data = await res.json();
    setListings(data.data || []);
    setLoading(false);
  }

  return (
    <div style={{ maxWidth:480, margin:"0 auto", minHeight:"100vh", background:"#F7FAF9", paddingBottom:80 }}>
      <div style={{ background:"#fff", padding:16, borderBottom:"1px solid #E4ECEA" }}>
        <div style={{ fontSize:24, fontWeight:800, color:MINT, marginBottom:12 }}>SOOKED</div>
        <input value={search} onChange={e=>setSearch(e.target.value)}
          onKeyDown={e=>e.key==="Enter"&&fetchListings()}
          placeholder="Rechercher..."
          style={{ width:"100%", padding:"10px 14px", borderRadius:12, border:"1.5px solid #E4ECEA", fontSize:14, background:"#F7FAF9", boxSizing:"border-box" }}/>
        <div style={{ display:"flex", gap:8, overflowX:"auto", marginTop:12, paddingBottom:4 }}>
          {CATS.map(c=>(
            <button key={c} onClick={()=>setCategory(c)}
              style={{ padding:"6px 14px", borderRadius:20, border:"none", cursor:"pointer", whiteSpace:"nowrap", fontSize:13, fontWeight:500, background:category===c?MINT:"#F2F5F4", color:category===c?"#fff":GRAY }}>
              {c}
            </button>
          ))}
        </div>
      </div>
      <div style={{ padding:12 }}>
        {loading ? (
          <div style={{ textAlign:"center", padding:48, color:GRAY }}>Chargement...</div>
        ) : listings.length === 0 ? (
          <div style={{ textAlign:"center", padding:48 }}>
            <div style={{ fontSize:48 }}>🔍</div>
            <div style={{ fontWeight:700, marginTop:8 }}>Aucun article</div>
          </div>
        ) : (
          <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:12 }}>
            {listings.map((l:any)=>(
              <div key={l.id} style={{ background:"#fff", borderRadius:16, overflow:"hidden", boxShadow:"0 2px 12px rgba(22,34,32,0.07)" }}>
                <div style={{ position:"relative", paddingTop:"120%", background:"#F2F5F4" }}>
                  {l.images?.[0]
                    ? <img src={l.images[0]} alt={l.title} style={{ position:"absolute", inset:0, width:"100%", height:"100%", objectFit:"cover" }}/>
                    : <div style={{ position:"absolute", inset:0, display:"flex", alignItems:"center", justifyContent:"center", fontSize:32 }}>👗</div>
                  }
                  <div style={{ position:"absolute", bottom:8, left:8, background:"rgba(255,255,255,0.9)", borderRadius:20, padding:"2px 8px", fontSize:11, fontWeight:600, color:MINT }}>
                    {l.condition}
                  </div>
                </div>
                <div style={{ padding:"10px 12px" }}>
                  <div style={{ fontSize:13, fontWeight:600, color:DARK, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{l.title}</div>
                  <div style={{ fontSize:12, color:GRAY, marginTop:2 }}>{l.city} · {l.size}</div>
                  <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginTop:8 }}>
                    <span style={{ fontSize:16, fontWeight:800, color:DARK }}>{l.price} DH</span>
                    {l.isNegotiable && <span style={{ background:"#E8FBF4", color:MINT, fontSize:10, fontWeight:600, padding:"2px 8px", borderRadius:20 }}>Négociable</span>}
                  </div>
                  <div style={{ fontSize:11, color:GRAY, marginTop:4 }}>{l.user?.name} · {l.user?.rating}★</div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
