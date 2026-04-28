"use client";
import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";

const MINT = "#2ECC9A";
const DARK = "#162220";
const GRAY = "#7A948E";

export default function ListingDetail() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;
  const [listing, setListing] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const [isFavorite, setIsFavorite] = useState(false);
  const [showOfferModal, setShowOfferModal] = useState(false);
  const [showBuyModal, setShowBuyModal] = useState(false);
  const [offerPrice, setOfferPrice] = useState("");
  const [deliveryMethod, setDeliveryMethod] = useState("meetup");
  const [submitting, setSubmitting] = useState(false);

  const userId = "default-user"; // À remplacer par l'ID de l'utilisateur connecté

  useEffect(() => {
    fetchListing();
  }, [id]);

  async function fetchListing() {
    try {
      const res = await fetch(`/api/listings/${id}`);
      const data = await res.json();
      if (res.ok) {
        setListing(data.data);
        // Vérifier si c'est en favoris
        checkIfFavorite();
      } else {
        alert("Annonce non trouvée");
      }
    } catch (e) {
      console.error(e);
      alert("Erreur lors du chargement");
    } finally {
      setLoading(false);
    }
  }

  async function checkIfFavorite() {
    try {
      const res = await fetch(`/api/favorites?userId=${userId}`);
      const data = await res.json();
      const isFav = data.data.some((f: any) => f.id === id);
      setIsFavorite(isFav);
    } catch (e) {
      console.error(e);
    }
  }

  async function toggleFavorite() {
    try {
      const res = await fetch("/api/favorites", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId,
          listingId: id,
          action: isFavorite ? "remove" : "add",
        }),
      });
      if (res.ok) {
        setIsFavorite(!isFavorite);
      }
    } catch (e) {
      console.error(e);
      alert("Erreur");
    }
  }

  async function submitOffer() {
    if (!offerPrice || parseFloat(offerPrice) <= 0) {
      alert("Veuillez entrer un prix valide");
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch("/api/offers/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          listingId: id,
          buyerId: userId,
          offeredPrice: parseFloat(offerPrice),
        }),
      });
      if (res.ok) {
        alert("Offre envoyée avec succès!");
        setShowOfferModal(false);
        setOfferPrice("");
      } else {
        const data = await res.json();
        alert(data.error || "Erreur");
      }
    } catch (e) {
      console.error(e);
      alert("Erreur");
    } finally {
      setSubmitting(false);
    }
  }

  async function submitBuy() {
    setSubmitting(true);
    try {
      const res = await fetch("/api/orders/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          listingId: id,
          buyerId: userId,
          sellerId: listing.userId,
          amount: listing.price,
          deliveryMethod,
        }),
      });
      if (res.ok) {
        const data = await res.json();
        alert("Commande créée! Redirection vers le paiement...");
        router.push(`/orders/${data.data.id}`);
      } else {
        alert("Erreur lors de la création de la commande");
      }
    } catch (e) {
      console.error(e);
      alert("Erreur");
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) {
    return (
      <div
        style={{
          maxWidth: 480,
          margin: "0 auto",
          minHeight: "100vh",
          background: "#F7FAF9",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <div style={{ color: GRAY }}>Chargement...</div>
      </div>
    );
  }

  if (!listing) {
    return (
      <div
        style={{
          maxWidth: 480,
          margin: "0 auto",
          minHeight: "100vh",
          background: "#F7FAF9",
          padding: 16,
        }}
      >
        <button
          onClick={() => router.back()}
          style={{
            background: "none",
            border: "none",
            fontSize: 24,
            cursor: "pointer",
            marginBottom: 24,
          }}
        >
          ← Retour
        </button>
        <div style={{ textAlign: "center", padding: 48, color: GRAY }}>
          Annonce non trouvée
        </div>
      </div>
    );
  }

  return (
    <div
      style={{
        maxWidth: 480,
        margin: "0 auto",
        minHeight: "100vh",
        background: "#F7FAF9",
        paddingBottom: 120,
      }}
    >
      {/* Header */}
      <div
        style={{
          background: "#fff",
          padding: "12px 16px",
          borderBottom: "1px solid #E4ECEA",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        <button
          onClick={() => router.back()}
          style={{
            background: "none",
            border: "none",
            fontSize: 24,
            cursor: "pointer",
          }}
        >
          ←
        </button>
        <div style={{ fontSize: 16, fontWeight: 600, color: DARK }}>
          Détail de l'annonce
        </div>
        <div style={{ width: 24 }}></div>
      </div>

      {/* Images Carousel */}
      <div
        style={{
          background: "#fff",
          position: "relative",
          aspectRatio: "1",
          overflow: "hidden",
        }}
      >
        {listing.images && listing.images.length > 0 ? (
          <>
            <img
              src={listing.images[activeImageIndex]}
              alt={listing.title}
              style={{
                width: "100%",
                height: "100%",
                objectFit: "cover",
              }}
            />
            {listing.images.length > 1 && (
              <>
                <div
                  style={{
                    position: "absolute",
                    bottom: 12,
                    left: "50%",
                    transform: "translateX(-50%)",
                    display: "flex",
                    gap: 6,
                  }}
                >
                  {listing.images.map((img: string, idx: number) => (
                    <button
                      key={idx}
                      onClick={() => setActiveImageIndex(idx)}
                      style={{
                        width: 24,
                        height: 24,
                        borderRadius: "50%",
                        border: "2px solid #fff",
                        background:
                          idx === activeImageIndex ? MINT : "rgba(0,0,0,0.3)",
                        cursor: "pointer",
                      }}
                    />
                  ))}
                </div>
                {/* Navigation arrows */}
                <button
                  onClick={() =>
                    setActiveImageIndex(
                      (activeImageIndex - 1 + listing.images.length) %
                        listing.images.length
                    )
                  }
                  style={{
                    position: "absolute",
                    left: 12,
                    top: "50%",
                    transform: "translateY(-50%)",
                    background: "rgba(255,255,255,0.8)",
                    border: "none",
                    width: 36,
                    height: 36,
                    borderRadius: "50%",
                    cursor: "pointer",
                    fontSize: 18,
                  }}
                >
                  ‹
                </button>
                <button
                  onClick={() =>
                    setActiveImageIndex(
                      (activeImageIndex + 1) % listing.images.length
                    )
                  }
                  style={{
                    position: "absolute",
                    right: 12,
                    top: "50%",
                    transform: "translateY(-50%)",
                    background: "rgba(255,255,255,0.8)",
                    border: "none",
                    width: 36,
                    height: 36,
                    borderRadius: "50%",
                    cursor: "pointer",
                    fontSize: 18,
                  }}
                >
                  ›
                </button>
              </>
            )}
          </>
        ) : (
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              width: "100%",
              height: "100%",
              background: "#F2F5F4",
              color: GRAY,
              fontSize: 48,
            }}
          >
            📷
          </div>
        )}
      </div>

      {/* Content */}
      <div style={{ padding: 16 }}>
        {/* Badge catégorie */}
        <div style={{ marginBottom: 12 }}>
          <span
            style={{
              display: "inline-block",
              padding: "4px 10px",
              borderRadius: 6,
              background: `${MINT}20`,
              color: MINT,
              fontSize: 12,
              fontWeight: 600,
            }}
          >
            {listing.category}
          </span>
        </div>

        {/* Titre et prix */}
        <h1
          style={{
            fontSize: 20,
            fontWeight: 700,
            color: DARK,
            margin: "0 0 12px 0",
          }}
        >
          {listing.title}
        </h1>

        <div
          style={{
            fontSize: 28,
            fontWeight: 800,
            color: MINT,
            marginBottom: 16,
          }}
        >
          {listing.price.toLocaleString("fr-FR", {
            style: "currency",
            currency: "EUR",
          })}
        </div>

        {/* État et taille */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gap: 12,
            marginBottom: 16,
          }}
        >
          <div
            style={{
              padding: 12,
              background: "#F2F5F4",
              borderRadius: 8,
            }}
          >
            <div style={{ fontSize: 12, color: GRAY, marginBottom: 4 }}>
              État
            </div>
            <div style={{ fontSize: 14, fontWeight: 600, color: DARK }}>
              {listing.condition}
            </div>
          </div>
          <div
            style={{
              padding: 12,
              background: "#F2F5F4",
              borderRadius: 8,
            }}
          >
            <div style={{ fontSize: 12, color: GRAY, marginBottom: 4 }}>
              Taille
            </div>
            <div style={{ fontSize: 14, fontWeight: 600, color: DARK }}>
              {listing.size}
            </div>
          </div>
        </div>

        {/* Description */}
        <div style={{ marginBottom: 20 }}>
          <h2
            style={{
              fontSize: 14,
              fontWeight: 700,
              color: DARK,
              marginBottom: 8,
            }}
          >
            Description
          </h2>
          <p
            style={{
              fontSize: 14,
              color: GRAY,
              lineHeight: "1.5",
              margin: 0,
              whiteSpace: "pre-wrap",
            }}
          >
            {listing.description}
          </p>
        </div>

        {/* Vendeur */}
        <div
          style={{
            padding: 12,
            background: "#F2F5F4",
            borderRadius: 8,
            marginBottom: 20,
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 12,
            }}
          >
            <div
              style={{
                width: 48,
                height: 48,
                borderRadius: "50%",
                background: listing.user.avatar ? "none" : MINT,
                backgroundImage: listing.user.avatar
                  ? `url(${listing.user.avatar})`
                  : "none",
                backgroundSize: "cover",
                backgroundPosition: "center",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "#fff",
                fontSize: 24,
              }}
            >
              {!listing.user.avatar && "👤"}
            </div>
            <div style={{ flex: 1 }}>
              <div
                style={{
                  fontSize: 14,
                  fontWeight: 600,
                  color: DARK,
                }}
              >
                {listing.user.name}
              </div>
              <div style={{ fontSize: 12, color: GRAY }}>
                {listing.user.city} • ⭐ {listing.user.rating.toFixed(1)}
              </div>
            </div>
            <Link href={`/sellers/${listing.user.id}`}>
              <button
                style={{
                  padding: "6px 12px",
                  background: "none",
                  border: `1.5px solid ${MINT}`,
                  borderRadius: 6,
                  color: MINT,
                  cursor: "pointer",
                  fontSize: 12,
                  fontWeight: 600,
                  whiteSpace: "nowrap",
                }}
              >
                Voir profil
              </button>
            </Link>
          </div>
        </div>

        {/* Info supplémentaire */}
        <div
          style={{
            padding: 12,
            background: "#F2F5F4",
            borderRadius: 8,
            marginBottom: 20,
          }}
        >
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
            <span style={{ color: GRAY, fontSize: 12 }}>Localisation</span>
            <span style={{ color: DARK, fontWeight: 600, fontSize: 12 }}>
              {listing.city}
            </span>
          </div>
          <div style={{ display: "flex", justifyContent: "space-between" }}>
            <span style={{ color: GRAY, fontSize: 12 }}>Publiée</span>
            <span style={{ color: DARK, fontWeight: 600, fontSize: 12 }}>
              {new Date(listing.createdAt).toLocaleDateString("fr-FR")}
            </span>
          </div>
        </div>
      </div>

      {/* Sticky Bottom Buttons */}
      <div
        style={{
          position: "fixed",
          bottom: 0,
          left: 0,
          right: 0,
          maxWidth: 480,
          margin: "0 auto",
          padding: 12,
          background: "#fff",
          borderTop: "1px solid #E4ECEA",
          display: "flex",
          gap: 12,
        }}
      >onClick={toggleFavorite}
          style={{
            width: 44,
            height: 44,
            borderRadius: 8,
            border: `1.5px solid ${MINT}`,
            background: "none",
            color: MINT,
            fontSize: 20,
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          {isFavorite ? "❤️" : "🤍"}
        </button>
        <button
          onClick={() => setShowOfferModal(true)}
          style={{
            flex: 1,
            padding: "14px 20px",
            borderRadius: 8,
            border: `1.5px solid ${MINT}`,
            background: "none",
            color: MINT,
            fontSize: 14,
            fontWeight: 700,
            cursor: "pointer",
            transition: "all 0.2s",
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = `${MINT}10`;
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = "none";
          }}
        >
          💬 Faire une offre
        </button>
        <button
          onClick={() => setShowBuyModal(true)}
          style={{
            flex: 1,
            padding: "14px 20px",
            borderRadius: 8,
            border: "none",
            background: MINT,
            color: "#fff",
            fontSize: 14,
            fontWeight: 700,
            cursor: "pointer",
            transition: "all 0.2s",
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.opacity = "0.9";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.opacity = "1";
          }}
        >
          🛒 Acheter
        </button>
      </div>

      {/* MODAL - Faire une offre */}
      {showOfferModal && (
        <div
          style={{
            position: "fixed",
            bottom: 0,
            left: 0,
            right: 0,
            maxWidth: 480,
            margin: "0 auto",
            background: "#fff",
            borderTopLeftRadius: 24,
            borderTopRightRadius: 24,
            padding: 20,
            boxShadow: "0 -4px 24px rgba(0,0,0,0.1)",
            zIndex: 1000,
          }}
        >
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              marginBottom: 20,
            }}
          >
            <h2 style={{ fontSize: 18, fontWeight: 700, margin: 0, color: DARK }}>
              Faire une offre
            </h2>
            <button
              onClick={() => setShowOfferModal(false)}
              style={{
                background: "none",
                border: "none",
                fontSize: 24,
                cursor: "pointer",
              }}
            >
              ✕
            </button>
          </div>

          <div style={{ marginBottom: 16 }}>
            <label
              style={{
                display: "block",
                fontSize: 12,
                fontWeight: 600,
                color: GRAY,
                marginBottom: 6,
              }}
            >
              Prix proposé (DH)
            </label>
            <input
              type="number"
              value={offerPrice}
              onChange={(e) => setOfferPrice(e.target.value)}
              placeholder={`Max: ${listing?.price} DH`}
              style={{
                width: "100%",
                padding: "12px 14px",
                borderRadius: 8,
                border: "1.5px solid #E4ECEA",
                fontSize: 14,
                boxSizing: "border-box",
              }}
            />
          </div>

          <div style={{ marginBottom: 20 }}>
            <p style={{ fontSize: 12, color: GRAY, margin: 0 }}>
              Prix initial: <strong>{listing?.price} DH</strong>
            </p>
          </div>

          <div style={{ display: "flex", gap: 12 }}>
            <button
              onClick={() => setShowOfferModal(false)}
              style={{
                flex: 1,
                padding: "12px 20px",
                borderRadius: 8,
                border: "1.5px solid #E4ECEA",
                background: "none",
                color: DARK,
                fontSize: 14,
                fontWeight: 700,
                cursor: "pointer",
              }}
            >
              Annuler
            </button>
            <button
              onClick={submitOffer}
              disabled={submitting}
              style={{
                flex: 1,
                padding: "12px 20px",
                borderRadius: 8,
                border: "none",
                background: MINT,
                color: "#fff",
                fontSize: 14,
                fontWeight: 700,
                cursor: submitting ? "not-allowed" : "pointer",
                opacity: submitting ? 0.6 : 1,
              }}
            >
              {submitting ? "Envoi..." : "Envoyer l'offre"}
            </button>
          </div>
        </div>
      )}

      {/* MODAL - Acheter maintenant */}
      {showBuyModal && (
        <div
          style={{
            position: "fixed",
            bottom: 0,
            left: 0,
            right: 0,
            maxWidth: 480,
            margin: "0 auto",
            background: "#fff",
            borderTopLeftRadius: 24,
            borderTopRightRadius: 24,
            padding: 20,
            boxShadow: "0 -4px 24px rgba(0,0,0,0.1)",
            zIndex: 1000,
            maxHeight: "80vh",
            overflowY: "auto",
          }}
        >
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              marginBottom: 20,
            }}
          >
            <h2 style={{ fontSize: 18, fontWeight: 700, margin: 0, color: DARK }}>
              Acheter maintenant
            </h2>
            <button
              onClick={() => setShowBuyModal(false)}
              style={{
                background: "none",
                border: "none",
                fontSize: 24,
                cursor: "pointer",
              }}
            >
              ✕
            </button>
          </div>

          <div
            style={{
              background: "#F2F5F4",
              padding: 12,
              borderRadius: 8,
              marginBottom: 16,
            }}
          >
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                marginBottom: 8,
              }}
            >
              <span style={{ color: GRAY }}>Prix article</span>
              <span style={{ fontWeight: 600, color: DARK }}>
                {listing?.price} DH
              </span>
            </div>
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                marginBottom: 8,
              }}
            >
              <span style={{ color: GRAY }}>Frais plateforme</span>
              <span style={{ fontWeight: 600, color: DARK }}>
                {Math.round(listing?.price * 0.05 * 100) / 100} DH
              </span>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between" }}>
              <span style={{ color: GRAY }}>Livraison</span>
              <span style={{ fontWeight: 600, color: DARK }}>
                {deliveryMethod === "delivery" ? "49 DH" : "Gratuit"}
              </span>
            </div>
          </div>

          <div style={{ marginBottom: 20 }}>
            <label
              style={{
                display: "block",
                fontSize: 12,
                fontWeight: 600,
                color: GRAY,
                marginBottom: 10,
              }}
            >
              Méthode de livraison
            </label>
            <div style={{ display: "flex", gap: 10 }}>
              <label style={{ flex: 1, display: "flex", alignItems: "center", gap: 8, cursor: "pointer" }}>
                <input
                  type="radio"
                  name="delivery"
                  value="meetup"
                  checked={deliveryMethod === "meetup"}
                  onChange={(e) => setDeliveryMethod(e.target.value)}
                  style={{ cursor: "pointer" }}
                />
                <span style={{ fontSize: 13 }}>Sur place</span>
              </label>
              <label style={{ flex: 1, display: "flex", alignItems: "center", gap: 8, cursor: "pointer" }}>
                <input
                  type="radio"
                  name="delivery"
                  value="delivery"
                  checked={deliveryMethod === "delivery"}
                  onChange={(e) => setDeliveryMethod(e.target.value)}
                  style={{ cursor: "pointer" }}
                />
                <span style={{ fontSize: 13 }}>Livraison (49 DH)</span>
              </label>
            </div>
          </div>

          <div
            style={{
              background: "#E8FBF4",
              padding: 12,
              borderRadius: 8,
              marginBottom: 20,
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between" }}>
              <span style={{ fontWeight: 700, color: DARK }}>Total</span>
              <span
                style={{
                  fontWeight: 800,
                  color: MINT,
                  fontSize: 16,
                }}
              >
                {(
                  listing?.price +
                  Math.round(listing?.price * 0.05 * 100) / 100 +
                  (deliveryMethod === "delivery" ? 49 : 0)
                ).toFixed(2)}{" "}
                DH
              </span>
            </div>
          </div>

          <div style={{ display: "flex", gap: 12 }}>
            <button
              onClick={() => setShowBuyModal(false)}
              style={{
                flex: 1,
                padding: "12px 20px",
                borderRadius: 8,
                border: "1.5px solid #E4ECEA",
                background: "none",
                color: DARK,
                fontSize: 14,
                fontWeight: 700,
                cursor: "pointer",
              }}
            >
              Annuler
            </button>
            <button
              onClick={submitBuy}
              disabled={submitting}
              style={{
                flex: 1,
                padding: "12px 20px",
                borderRadius: 8,
                border: "none",
                background: MINT,
                color: "#fff",
                fontSize: 14,
                fontWeight: 700,
                cursor: submitting ? "not-allowed" : "pointer",
                opacity: submitting ? 0.6 : 1,
              }}
            >
              {submitting ? "Traitement..." : "Procéder au paiement"}
            </button>
          </div>
        </div>
      )}

      {/* Overlay pour modals */}
      {(showOfferModal || showBuyModal) && (
        <div
          onClick={() => {
            setShowOfferModal(false);
            setShowBuyModal(false);
          }}
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: "rgba(0,0,0,0.5)",
            zIndex: 999,
          }}
        />
      )} Acheter maintenant
        </button>
      </div>
    </div>
  );
}
