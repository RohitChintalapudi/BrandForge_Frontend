import { useEffect, useState } from "react";
import api from "../api/axios";
import { toast } from "react-toastify";
import Confetti from "react-confetti";
import { useAuth } from "../context/AuthContext";

const BrandDashboard = () => {
  const { user } = useAuth();
  const [form, setForm] = useState({
    title: "",
    description: "",
    reward: "",
    deadline: "",
  });

  const [campaigns, setCampaigns] = useState([]);
  const [selectedCampaign, setSelectedCampaign] = useState(null);
  const [submissions, setSubmissions] = useState([]);
  const [winner, setWinner] = useState(null);
  const [showConfetti, setShowConfetti] = useState(false);
  const [showWinner, setShowWinner] = useState(false); 

  const currentUserId = String(user?._id ?? user?.id ?? "");

  const getIdValue = (value) => {
    if (value == null) return null;
    if (typeof value === "object") return String(value._id ?? value.id ?? "");
    return String(value);
  };

  const isCampaignOwnedByCurrentBrand = (campaign) => {
    if (!currentUserId || !campaign) return false;
    const ownerRefs = [
      campaign.brand,
      campaign.createdBy,
      campaign.owner,
      campaign.user,
      campaign.brandId,
      campaign.createdById,
      campaign.ownerId,
      campaign.userId,
    ];
    return ownerRefs.some((ref) => getIdValue(ref) === currentUserId);
  };

  const shortDescription = (text, maxChars = 90) => {
    const s = (text ?? "").toString().trim();
    if (!s) return "No description available";
    if (s.length <= maxChars) return s;
    const cut = s.slice(0, maxChars);
    const lastSpace = cut.lastIndexOf(" ");
    return `${cut.slice(0, lastSpace > 40 ? lastSpace : maxChars).trim()}...`;
  };

  const COMMISSION_RATE = 0.03; // 3% cut from reward
  const DEFAULT_BRAND_TOTAL = 50000;

  const parseRewardToNumber = (reward) => {
    if (reward == null) return null;
    const raw = String(reward).trim();
    if (!raw) return null;
    const cleaned = raw.replace(/,/g, "").replace(/[^\d.]/g, "");
    const n = parseFloat(cleaned);
    return Number.isFinite(n) ? n : null;
  };

  const ownedCampaignsForCommission = campaigns.filter(
    (c) => c && c._id && isCampaignOwnedByCurrentBrand(c)
  );

  // Some backends may return duplicate campaign entries; avoid double counting.
  const uniqueOwnedCampaignsForCommission = Array.from(
    new Map(
      ownedCampaignsForCommission.map((c) => [String(c._id), c])
    ).values()
  );

  const totalCommissionDeduction = uniqueOwnedCampaignsForCommission.reduce(
    (sum, c) => {
      const rewardNum = parseRewardToNumber(c.reward);
      if (rewardNum == null) return sum;
      return sum + rewardNum * COMMISSION_RATE;
    },
    0
  );

  // Start from the brand's default budget and deduct 3% commission per listed campaign.
  const brandNetTotal = Math.max(
    0,
    DEFAULT_BRAND_TOTAL - totalCommissionDeduction
  );

  const fetchCampaigns = async () => {
    try {
      const res = await api.get("/api/campaigns");
      setCampaigns(res.data || []);
    } catch {
      toast.error("Failed to load campaigns");
    }
  };

  useEffect(() => {
    fetchCampaigns();
  }, []);

  const handleCreate = async (e) => {
    e.preventDefault();
    try {
      await api.post("/api/campaigns", form);
      toast.success("Campaign created (pending admin approval)");
      setForm({ title: "", description: "", reward: "", deadline: "" });
      fetchCampaigns();
    } catch {
      toast.error("Failed to create campaign");
    }
  };

  const openSubmissions = async (campaign) => {
    setSelectedCampaign(campaign);
    setWinner(null);
    setShowWinner(false); 
    setShowConfetti(false);

    try {
      const res = await api.get(`/api/submissions/campaign/${campaign._id}`);
      setSubmissions(res.data || []);

      const winning = res.data?.find((s) => s.status === "winner");
      if (winning) setWinner(winning);
    } catch {
      toast.error("Failed to load submissions");
    }
  };

  const selectWinner = async (id) => {
    try {
      await api.put(`/api/submissions/${id}/winner`);
      toast.success("Winner selected");

      setSubmissions((prev) =>
        prev.map((s) => (s._id === id ? { ...s, status: "winner" } : s))
      );

      const selected = submissions.find((s) => s._id === id);
      if (selected) {
        setWinner({ ...selected, status: "winner" });
        setShowWinner(false);
      }
    } catch {
      toast.error("Failed to select winner");
    }
  };

  const viewWinner = () => {
    setShowWinner(true);
    setShowConfetti(true);

    setTimeout(() => {
      setShowConfetti(false);
    }, 5000);
  };

  return (
    <div className="dashboard-wrapper">
      {showConfetti && <Confetti />}

      <div className="dashboard">
        <div className="dashboard-header brand-header-row">
          <div className="brand-header-left">
            <h2>🏢 Brand Dashboard</h2>
            <b className="dashboard-subtitle">
              Create campaigns and select winners
            </b>
          </div>

          {brandNetTotal != null && (
            <span
              className="navbar-total-won"
              title="3% commission will be deducted from your brand budget based on listed campaign rewards."
            >
              Total to receive:{" "}
              <strong>₹{brandNetTotal.toLocaleString("en-IN")}</strong>
              <sup className="navbar-total-asterisk">*</sup>
            </span>
          )}
        </div>

        {!selectedCampaign && (
          <>
            <div className="card premium-card create-card">
              <h3>Create Campaign</h3>

              <form onSubmit={handleCreate} className="forms">
                <input
                  placeholder="Campaign Title"
                  value={form.title}
                  onChange={(e) => setForm({ ...form, title: e.target.value })}
                  required
                />

                <textarea
                  placeholder="Campaign Description"
                  value={form.description}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      description: e.target.value,
                    })
                  }
                  required
                />

                <input
                  placeholder="Reward (e.g ₹5000)"
                  value={form.reward}
                  onChange={(e) => setForm({ ...form, reward: e.target.value })}
                  required
                />

                <input
                  type="date"
                  value={form.deadline}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      deadline: e.target.value,
                    })
                  }
                  required
                />

                <button className="action-btn premium-btn">
                  Create Campaign (3% of reward will be deducted as platform fee)
                </button>
              </form>
            </div>
              <h3>Campaigns created by you</h3>
            <div className="grid" style={{ marginTop: "2rem" }}>
              {campaigns
                .filter(
                  (c) => c && c._id && isCampaignOwnedByCurrentBrand(c)
                )
                .map((c) => (
                  <div className="card premium-card" key={c._id}>
                    <div className="card-header">
                      <h3>{c.title || "Untitled Campaign"}</h3>
                      {c.status && (
                        <span className={`badge ${c.status}`}>
                          {c.status === "pending" && "Pending Approval"}
                          {c.status === "approved" && "Approved"}
                        </span>
                      )}
                    </div>

                    <p className="card-description">
                      {shortDescription(c.description)}
                    </p>

                    <button
                      className="action-btn premium-btn"
                      style={{ marginTop: "0.8rem" }}
                      onClick={() => openSubmissions(c)}
                    >
                      View Submissions
                    </button>
                  </div>
                ))}
            </div>
          </>
        )}

        {selectedCampaign && (
          <>
            <button
              className="action-btn premium-btn back-btn"
              onClick={() => {
                setSelectedCampaign(null);
                setShowWinner(false);
                setShowConfetti(false);
              }}
            >
              ← Back
            </button>

            <h3 className="section-title">Submissions</h3>

            {winner && !showWinner && (
              <button
                className="action-btn premium-btn"
                style={{ marginBottom: "1.5rem" }}
                onClick={viewWinner}
              >
                View Winner 🎉
              </button>
            )}

            {winner && showWinner && (
              <div
                className="card premium-card winner-card"
                style={{ marginBottom: "2rem" }}
              >
                <h3>🏆 Winner Selected</h3>
                <p>
                  <strong>{winner.creator?.name}</strong>
                </p>

                <a
                  href={winner.contentUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="content-link"
                >
                  View Winning Content
                </a>
              </div>
            )}

            <div className="grid">
              {submissions.map((s) => (
                <div className="card premium-card submission-card" key={s._id}>
                  <div className="submission-top">
                    <div className="submission-creator">
                      <div className="submission-avatar">
                        {(s.creator?.name || "C").slice(0, 1).toUpperCase()}
                      </div>
                      <div className="submission-creator-meta">
                        <div className="submission-creator-label">Creator</div>
                        <div className="submission-creator-name">
                          {s.creator?.name || "Unknown"}
                        </div>
                      </div>
                    </div>

                    {s.status === "winner" ? (
                      <span className="submission-status submission-status--winner">
                        🏆 Winner
                      </span>
                    ) : (
                      <span className="submission-status submission-status--new">
                        New
                      </span>
                    )}
                  </div>

                  <div className="submission-actions">
                    <a
                      href={s.contentUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="submission-link"
                    >
                      View Content
                    </a>

                    {s.status !== "winner" && (
                      <button
                        type="button"
                        className="submission-btn"
                        onClick={() => selectWinner(s._id)}
                      >
                        Select Winner
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default BrandDashboard;
