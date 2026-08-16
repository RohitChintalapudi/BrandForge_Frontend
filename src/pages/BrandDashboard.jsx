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
  const [formErrors, setFormErrors] = useState({});
  const [touched, setTouched] = useState({});

  const getTomorrowDateString = () => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    return tomorrow.toISOString().split("T")[0];
  };

  const validateField = (name, value) => {
    let error = "";
    if (name === "title") {
      if (!value.trim()) {
        error = "Campaign title is required";
      } else if (value.trim().length < 5) {
        error = "Title must be at least 5 characters";
      } else if (value.trim().length > 50) {
        error = "Title cannot exceed 50 characters";
      }
    } else if (name === "description") {
      if (!value.trim()) {
        error = "Description is required";
      } else if (value.trim().length < 20) {
        error = "Description must be at least 20 characters";
      } else if (value.trim().length > 800) {
        error = "Description cannot exceed 800 characters";
      }
    } else if (name === "reward") {
      const parsed = parseFloat(value.replace(/[^\d.]/g, ""));
      if (!value.trim()) {
        error = "Reward is required";
      } else if (isNaN(parsed) || parsed <= 0) {
        error = "Reward must be a positive number";
      } else if (parsed < 500) {
        error = "Minimum campaign reward is ₹500";
      }
    } else if (name === "deadline") {
      if (!value) {
        error = "Deadline is required";
      } else {
        const selectedDate = new Date(value);
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        if (selectedDate <= today) {
          error = "Deadline must tomorrow or later";
        }
      }
    }
    return error;
  };

  const handleBlur = (e) => {
    const { name, value } = e.target;
    setTouched((prev) => ({ ...prev, [name]: true }));
    const error = validateField(name, value);
    setFormErrors((prev) => ({ ...prev, [name]: error }));
  };

  const handleChange = (name, value) => {
    setForm((prev) => ({ ...prev, [name]: value }));
    if (touched[name]) {
      const error = validateField(name, value);
      setFormErrors((prev) => ({ ...prev, [name]: error }));
    }
  };

  const isFormInvalid = () => {
    const hasErrors = Object.values(formErrors).some((err) => !!err);
    const allFilled = form.title && form.description && form.reward && form.deadline;
    return hasErrors || !allFilled;
  };

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

    const errorsList = {};
    Object.keys(form).forEach((key) => {
      const err = validateField(key, form[key]);
      if (err) errorsList[key] = err;
    });

    if (Object.keys(errorsList).length > 0) {
      setFormErrors(errorsList);
      const touchedAll = {};
      Object.keys(form).forEach((k) => { touchedAll[k] = true; });
      setTouched(touchedAll);
      toast.error("Please resolve the errors on the form");
      return;
    }

    try {
      await api.post("/api/campaigns", form);
      toast.success("Campaign created (pending admin approval)");
      setForm({ title: "", description: "", reward: "", deadline: "" });
      setFormErrors({});
      setTouched({});
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
        {/* HERO BANNER */}
        <div className="dashboard-hero">
          <div className="hero-text-col">
            <h2>🏢 Brand Dashboard</h2>
            <p className="dashboard-subtitle">
              Establish campaigns, discover creative talent, and select winning content partnerships.
            </p>
          </div>
          {brandNetTotal != null && (
            <div className="hero-stats-grid">
              <div className="stat-card" title="3% commission will be deducted from your brand budget based on listed campaign rewards.">
                <h4>Remaining Budget</h4>
                <span className="stat-val">₹{brandNetTotal.toLocaleString("en-IN")}</span>
              </div>
              <div className="stat-card">
                <h4>Your Campaigns</h4>
                <span className="stat-val">
                  {campaigns.filter((c) => c && c._id && isCampaignOwnedByCurrentBrand(c)).length}
                </span>
              </div>
            </div>
          )}
        </div>

        {!selectedCampaign && (
          <>
            <div className="card brand-create-card">
              <h3>Create New Campaign</h3>

              <form onSubmit={handleCreate} className="forms">
                <div className="form-group-validation">
                  <input
                    type="text"
                    name="title"
                    placeholder="Campaign Title (e.g. Summer Launch Campaign)"
                    value={form.title}
                    onChange={(e) => handleChange("title", e.target.value)}
                    onBlur={handleBlur}
                    className={touched.title ? (formErrors.title ? "is-invalid" : "is-valid") : ""}
                    required
                  />
                  {touched.title && formErrors.title && (
                    <span className="validation-error-tag">{formErrors.title}</span>
                  )}
                </div>

                <div className="form-group-validation">
                  <textarea
                    name="description"
                    placeholder="Campaign Description & brief requirements..."
                    value={form.description}
                    onChange={(e) => handleChange("description", e.target.value)}
                    onBlur={handleBlur}
                    className={touched.description ? (formErrors.description ? "is-invalid" : "is-valid") : ""}
                    required
                  />
                  {touched.description && formErrors.description && (
                    <span className="validation-error-tag">{formErrors.description}</span>
                  )}
                </div>

                <div className="brand-form-row">
                  <div className="form-group-validation">
                    <input
                      type="text"
                      name="reward"
                      placeholder="Reward (e.g. ₹5000)"
                      value={form.reward}
                      onChange={(e) => handleChange("reward", e.target.value)}
                      onBlur={handleBlur}
                      className={touched.reward ? (formErrors.reward ? "is-invalid" : "is-valid") : ""}
                      required
                    />
                    {touched.reward && formErrors.reward && (
                      <span className="validation-error-tag">{formErrors.reward}</span>
                    )}
                  </div>

                  <div className="form-group-validation">
                    <input
                      type="date"
                      name="deadline"
                      min={getTomorrowDateString()}
                      value={form.deadline}
                      onChange={(e) => handleChange("deadline", e.target.value)}
                      onBlur={handleBlur}
                      className={touched.deadline ? (formErrors.deadline ? "is-invalid" : "is-valid") : ""}
                      required
                    />
                    {touched.deadline && formErrors.deadline && (
                      <span className="validation-error-tag">{formErrors.deadline}</span>
                    )}
                  </div>
                </div>

                <button 
                  type="submit" 
                  className="brand-submit-btn"
                  disabled={isFormInvalid()}
                >
                  Launch Campaign (3% platform fee applied)
                </button>
              </form>
            </div>

            <h3 className="section-title">Campaigns created by you</h3>
            <div className="grid" style={{ marginTop: "1.5rem" }}>
              {campaigns
                .filter(
                  (c) => c && c._id && isCampaignOwnedByCurrentBrand(c)
                )
                .map((c) => (
                  <div className="card creator-campaign-card" key={c._id}>
                    <div className="campaign-card-header">
                      <h3 className="campaign-card-title">{c.title || "Untitled Campaign"}</h3>
                      {c.status && (
                        <span className={c.status === "approved" ? "status-badge-approved" : "status-badge-pending"}>
                          {c.status === "pending" && "Pending Approval"}
                          {c.status === "approved" && "Approved"}
                        </span>
                      )}
                    </div>

                    <p className="campaign-card-desc">
                      {shortDescription(c.description, 110)}
                    </p>

                    <div className="campaign-card-meta">
                      {c.reward && (
                        <div className="campaign-meta-item">
                          <span>💰</span>
                          <span>Reward: <strong>{c.reward}</strong></span>
                        </div>
                      )}
                      {c.deadline && (
                        <div className="campaign-meta-item">
                          <span>📅</span>
                          <span>Deadline: <strong>{new Date(c.deadline).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}</strong></span>
                        </div>
                      )}
                    </div>

                    <div className="campaign-card-actions">
                      <button
                        className="campaign-submit-btn"
                        style={{ width: "100%" }}
                        onClick={() => openSubmissions(c)}
                      >
                        View Submissions
                      </button>
                    </div>
                  </div>
                ))}
            </div>
          </>
        )}

        {selectedCampaign && (
          <>
            <button
              className="campaign-details-btn"
              style={{ marginBottom: "1.8rem", fontSize: "0.95rem" }}
              onClick={() => {
                setSelectedCampaign(null);
                setShowWinner(false);
                setShowConfetti(false);
              }}
            >
              ← Back to Campaign Creator
            </button>

            <h3 className="section-title" style={{ marginBottom: "1.5rem" }}>
              Submissions for: <strong style={{ color: "var(--purple-2)" }}>{selectedCampaign.title}</strong>
            </h3>

            {winner && !showWinner && (
              <button
                className="campaign-submit-btn"
                style={{ marginBottom: "2rem", display: "inline-block", background: "linear-gradient(135deg, #f59e0b, #d97706)" }}
                onClick={viewWinner}
              >
                View Selected Winner 🎉
              </button>
            )}

            {winner && showWinner && (
              <div className="brand-winner-banner">
                <div className="brand-winner-content">
                  <h3 className="brand-winner-title">🏆 Campaign Winner Crowned!</h3>
                  <b className="brand-winner-creator">Creator: {winner.creator?.name || "Unknown Creator"}</b>
                  <a
                    href={winner.contentUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="brand-winner-link"
                  >
                    View Winning Content Submission →
                  </a>
                </div>
              </div>
            )}

            <div className="grid">
              {submissions.map((s) => (
                <div className="brand-submission-card" key={s._id}>
                  <div className="submission-top">
                    <div className="submission-creator">
                      <div className="avatar-initial">
                        {(s.creator?.name || "C").slice(0, 1).toUpperCase()}
                      </div>
                      <div className="submission-creator-meta">
                        <span className="submission-creator-label">Creator</span>
                        <span className="submission-creator-name">
                          {s.creator?.name || "Unknown"}
                        </span>
                      </div>
                    </div>

                    {s.status === "winner" ? (
                      <span className="winner-badge">
                        🏆 Winner
                      </span>
                    ) : (
                      <span className="status-badge-pending" style={{ fontSize: "0.7rem", padding: "0.2rem 0.5rem" }}>
                        Reviewing
                      </span>
                    )}
                  </div>

                  <div className="submission-actions">
                    <a
                      href={s.contentUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="submission-view-link"
                    >
                      View Submission →
                    </a>

                    {s.status !== "winner" && (
                      <button
                        type="button"
                        className="select-winner-btn"
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
