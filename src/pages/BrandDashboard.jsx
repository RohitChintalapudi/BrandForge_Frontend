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
  const [loading, setLoading] = useState(true);

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

  const brandNetTotal = Math.max(
    0,
    DEFAULT_BRAND_TOTAL - totalCommissionDeduction
  );

  const fetchCampaigns = async () => {
    try {
      setLoading(true);
      const res = await api.get("/api/campaigns");
      setCampaigns(res.data || []);
    } catch {
      toast.error("Failed to load campaigns");
    } finally {
      setLoading(false);
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
      toast.success("Winner selected successfully!");

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
    <div className="brand-dashboard-root">
      {showConfetti && <Confetti />}

      <style>{`
        /* High-end executive dark theme for Brand Dashboard */
        .brand-dashboard-root {
          --b-bg: #070514;
          --b-surface: rgba(255, 255, 255, 0.03);
          --b-surface-hover: rgba(255, 255, 255, 0.06);
          --b-border: rgba(255, 255, 255, 0.06);
          --b-border-hover: rgba(168, 85, 247, 0.4);
          --b-primary: #7c3aed;
          --b-primary-glow: rgba(124, 58, 237, 0.3);
          --b-gold: #fbbf24;
          --b-gold-glow: rgba(251, 191, 36, 0.2);
          --b-text-main: #f3f4f6;
          --b-text-muted: #9ca3af;
          
          background-color: var(--b-bg) !important;
          color: var(--b-text-main) !important;
          min-height: calc(100vh - 74px);
          position: relative;
          overflow: hidden;
          font-family: 'Outfit', 'Plus Jakarta Sans', 'Inter', sans-serif;
        }

        /* Ambient background glow */
        .b-ambient-glow {
          position: absolute;
          border-radius: 50%;
          filter: blur(140px);
          opacity: 0.45;
          pointer-events: none;
          z-index: 0;
        }
        
        .b-glow-purple {
          width: 500px;
          height: 500px;
          background: radial-gradient(circle, #8b5cf6 0%, transparent 70%);
          top: -15%;
          left: -10%;
          animation: float-glow-1 20s infinite alternate ease-in-out;
        }
        
        .b-glow-blue {
          width: 600px;
          height: 600px;
          background: radial-gradient(circle, #3b82f6 0%, transparent 70%);
          bottom: -15%;
          right: -10%;
          animation: float-glow-2 25s infinite alternate ease-in-out;
        }
        
        .b-glow-pink {
          width: 400px;
          height: 400px;
          background: radial-gradient(circle, #ec4899 0%, transparent 70%);
          top: 30%;
          left: 40%;
          animation: float-glow-3 22s infinite alternate ease-in-out;
        }

        @keyframes float-glow-1 {
          0% { transform: translate(0, 0) scale(1); }
          100% { transform: translate(80px, 40px) scale(1.15); }
        }
        @keyframes float-glow-2 {
          0% { transform: translate(0, 0) scale(1.1); }
          100% { transform: translate(-100px, -60px) scale(0.9); }
        }
        @keyframes float-glow-3 {
          0% { transform: translate(-30px, 30px); }
          100% { transform: translate(30px, -30px); }
        }

        .b-container {
          max-width: 1280px;
          margin: 0 auto;
          padding: 3rem 1.5rem;
          position: relative;
          z-index: 1;
        }

        /* Hero Banner */
        .b-hero {
          background: linear-gradient(135deg, rgba(20, 15, 50, 0.4), rgba(40, 15, 80, 0.2)) !important;
          backdrop-filter: blur(16px) !important;
          -webkit-backdrop-filter: blur(16px) !important;
          border: 1px solid var(--b-border) !important;
          border-radius: 28px;
          padding: 2.5rem 3.5rem;
          margin-bottom: 3rem;
          display: flex;
          justify-content: space-between;
          align-items: center;
          position: relative;
          overflow: hidden;
          box-shadow: 0 10px 40px rgba(0, 0, 0, 0.35);
        }

        .b-hero::before {
          content: '';
          position: absolute;
          top: 0; left: 0; right: 0; bottom: 0;
          background: radial-gradient(circle at 0% 0%, rgba(139, 92, 246, 0.12), transparent 50%);
          pointer-events: none;
        }

        @media (max-width: 768px) {
          .b-hero {
            flex-direction: column;
            align-items: flex-start;
            gap: 1.5rem;
            padding: 2rem;
          }
        }

        .b-hero-title {
          font-size: 2.6rem;
          font-weight: 850;
          margin: 0 0 0.5rem;
          background: linear-gradient(to right, #ffffff, #c084fc, #818cf8);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          letter-spacing: -0.03em;
        }

        .b-hero-subtitle {
          font-size: 1.1rem;
          color: var(--b-text-muted);
          margin: 0;
          font-weight: 500;
          max-width: 600px;
          line-height: 1.6;
        }

        /* stats widget */
        .b-stats-grid {
          display: flex;
          gap: 1.5rem;
          flex-wrap: wrap;
        }

        .b-stat-card {
          background: rgba(255, 255, 255, 0.02);
          backdrop-filter: blur(10px);
          -webkit-backdrop-filter: blur(10px);
          border: 1px solid var(--b-border);
          border-radius: 20px;
          padding: 1.1rem 2rem;
          min-width: 170px;
          text-align: center;
          box-shadow: 0 4px 20px rgba(0, 0, 0, 0.2);
          transition: all 0.3s ease;
          position: relative;
        }

        .b-stat-card::after {
          content: '';
          position: absolute;
          top: 0; left: 0; width: 100%; height: 3px;
          background: linear-gradient(90deg, #a855f7, #6366f1);
          opacity: 0.8;
        }

        .b-stat-card:hover {
          transform: translateY(-4px);
          border-color: var(--b-border-hover);
          box-shadow: 0 10px 25px var(--b-primary-glow);
        }

        .b-stat-label {
          font-size: 0.72rem;
          text-transform: uppercase;
          color: var(--b-text-muted);
          font-weight: 700;
          letter-spacing: 0.08em;
          margin-bottom: 0.4rem;
        }

        .b-stat-value {
          font-size: 1.8rem;
          font-weight: 900;
          color: #ffffff;
          line-height: 1.1;
        }

        /* Glass Form Panel */
        .b-create-panel {
          background: var(--b-surface);
          backdrop-filter: blur(16px);
          -webkit-backdrop-filter: blur(16px);
          border: 1px solid var(--b-border);
          border-radius: 28px;
          padding: 2.5rem;
          margin-bottom: 3.5rem;
          box-shadow: 0 10px 40px rgba(0, 0, 0, 0.3);
        }

        .b-create-header {
          margin-bottom: 2rem;
        }

        .b-create-title {
          font-size: 1.6rem;
          font-weight: 850;
          color: #ffffff;
          margin: 0 0 0.5rem;
          letter-spacing: -0.02em;
        }

        .b-create-desc {
          font-size: 0.98rem;
          color: var(--b-text-muted);
          margin: 0;
        }

        .b-form-group {
          margin-bottom: 1.5rem;
        }

        .b-label {
          display: block;
          font-size: 0.85rem;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.05em;
          color: var(--b-text-muted);
          margin-bottom: 0.6rem;
        }

        /* Inputs */
        .b-input, .b-textarea {
          background: rgba(255, 255, 255, 0.02) !important;
          border: 1px solid rgba(255, 255, 255, 0.08) !important;
          border-radius: 14px !important;
          padding: 0.9rem 1.1rem !important;
          color: #ffffff !important;
          font-size: 0.95rem !important;
          width: 100% !important;
          transition: all 0.25s ease !important;
        }

        .b-input:focus, .b-textarea:focus {
          border-color: #a855f7 !important;
          box-shadow: 0 0 12px rgba(168, 85, 247, 0.2) !important;
          outline: none !important;
        }

        .b-textarea {
          min-height: 120px;
          resize: vertical;
        }

        .b-input-row {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 1.5rem;
        }

        @media (max-width: 600px) {
          .b-input-row {
            grid-template-columns: 1fr;
          }
        }

        .b-error-msg {
          font-size: 0.8rem;
          color: #fb7185;
          margin-top: 0.45rem;
          display: block;
          font-weight: 600;
        }

        /* Action Buttons */
        .btn-launch-neon {
          background: linear-gradient(135deg, #7c3aed, #4f46e5);
          color: #ffffff;
          border: none;
          border-radius: 14px;
          padding: 0.95rem 1.5rem;
          font-size: 0.95rem;
          font-weight: 800;
          cursor: pointer;
          box-shadow: 0 4px 15px rgba(124, 58, 237, 0.35);
          transition: all 0.25s ease;
          width: 100%;
          text-align: center;
        }

        .btn-launch-neon:hover {
          transform: translateY(-2px);
          box-shadow: 
            0 8px 24px rgba(124, 58, 237, 0.5),
            0 0 15px rgba(99, 102, 241, 0.3);
        }

        .btn-launch-neon:disabled {
          background: rgba(255, 255, 255, 0.04) !important;
          border: 1px solid rgba(255, 255, 255, 0.08) !important;
          color: rgba(255, 255, 255, 0.2) !important;
          box-shadow: none !important;
          cursor: not-allowed !important;
          transform: none !important;
        }

        /* Campaign Section Title */
        .b-section-title {
          font-size: 1.5rem;
          font-weight: 800;
          color: #ffffff;
          margin: 0 0 1.5rem;
          letter-spacing: -0.015em;
        }

        /* Campaign Grids */
        .b-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(330px, 1fr));
          gap: 2rem;
        }

        /* Owned Campaign Ticket Cards */
        .b-campaign-card {
          background: var(--b-surface);
          backdrop-filter: blur(16px);
          -webkit-backdrop-filter: blur(16px);
          border: 1px solid var(--b-border);
          border-radius: 24px;
          padding: 2rem;
          display: flex;
          flex-direction: column;
          justify-content: space-between;
          min-height: 310px;
          box-shadow: 0 8px 32px rgba(0, 0, 0, 0.25);
          transition: all 0.4s cubic-bezier(0.16, 1, 0.3, 1);
          position: relative;
        }

        .b-campaign-card::before {
          content: '';
          position: absolute;
          top: 0; left: 0; right: 0; bottom: 0;
          border-radius: 24px;
          background: radial-gradient(circle at 100% 0%, rgba(139, 92, 246, 0.08), transparent 60%);
          pointer-events: none;
        }

        .b-campaign-card:hover {
          transform: translateY(-6px);
          border-color: var(--b-border-hover);
          box-shadow: 
            0 20px 40px rgba(0, 0, 0, 0.35),
            0 0 25px rgba(124, 58, 237, 0.12);
        }

        .b-card-header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          gap: 1.25rem;
          margin-bottom: 1.1rem;
        }

        .b-card-title {
          font-size: 1.3rem;
          font-weight: 800;
          color: #ffffff;
          margin: 0;
          line-height: 1.35;
          letter-spacing: -0.015em;
        }

        /* Status Badges */
        .b-badge-approved {
          background: rgba(16, 185, 129, 0.12);
          border: 1px solid rgba(16, 185, 129, 0.3);
          color: #34d399;
          padding: 0.3rem 0.75rem;
          font-size: 0.68rem;
          font-weight: 750;
          border-radius: 99px;
          text-transform: uppercase;
          letter-spacing: 0.05em;
          flex-shrink: 0;
        }

        .b-badge-pending {
          background: rgba(245, 158, 11, 0.12);
          border: 1px solid rgba(245, 158, 11, 0.3);
          color: #fbbf24;
          padding: 0.3rem 0.75rem;
          font-size: 0.68rem;
          font-weight: 750;
          border-radius: 99px;
          text-transform: uppercase;
          letter-spacing: 0.05em;
          flex-shrink: 0;
        }

        .b-card-desc {
          font-size: 0.95rem;
          color: var(--b-text-muted);
          line-height: 1.6;
          margin-bottom: 1.75rem;
          flex-grow: 1;
        }

        .b-card-meta {
          display: flex;
          flex-direction: column;
          gap: 0.5rem;
          padding-top: 1rem;
          border-top: 1px solid rgba(255, 255, 255, 0.05);
          margin-bottom: 1.5rem;
        }

        .b-meta-item {
          display: flex;
          align-items: center;
          gap: 0.6rem;
          font-size: 0.88rem;
          color: var(--b-text-muted);
        }

        .b-meta-item strong {
          color: #f3f4f6;
          font-weight: 600;
        }

        .btn-view-submissions {
          background: linear-gradient(135deg, #7c3aed, #4f46e5);
          color: #ffffff;
          border: none;
          border-radius: 14px;
          padding: 0.8rem 1.5rem;
          font-size: 0.9rem;
          font-weight: 750;
          cursor: pointer;
          transition: all 0.25s ease;
          width: 100%;
          text-align: center;
          box-shadow: 0 4px 15px rgba(124, 58, 237, 0.25);
        }

        .btn-view-submissions:hover {
          transform: translateY(-2px);
          box-shadow: 0 6px 20px rgba(124, 58, 237, 0.45);
        }

        /* Back to Creator button */
        .btn-back-ghost {
          background: rgba(255, 255, 255, 0.04);
          color: #ffffff;
          border: 1px solid rgba(255, 255, 255, 0.12);
          border-radius: 14px;
          padding: 0.8rem 1.25rem;
          font-size: 0.9rem;
          font-weight: 650;
          cursor: pointer;
          transition: all 0.25s ease;
          margin-bottom: 2.2rem;
          display: inline-flex;
          align-items: center;
          gap: 0.5rem;
        }

        .btn-back-ghost:hover {
          background: rgba(255, 255, 255, 0.08);
          border-color: rgba(255, 255, 255, 0.25);
          transform: translateY(-2px);
        }

        /* Winner Announcement Panel */
        .b-winner-banner {
          background: linear-gradient(135deg, rgba(251, 191, 36, 0.12), rgba(217, 119, 6, 0.05)) !important;
          backdrop-filter: blur(20px);
          -webkit-backdrop-filter: blur(20px);
          border: 1px solid rgba(251, 191, 36, 0.4) !important;
          border-radius: 24px;
          padding: 2rem 2.5rem;
          margin-bottom: 2.5rem;
          box-shadow: 0 10px 40px rgba(251, 191, 36, 0.12);
          position: relative;
          overflow: hidden;
          animation: winner-pulse 2.5s infinite alternate ease-in-out;
        }

        @keyframes winner-pulse {
          0% { box-shadow: 0 8px 24px rgba(251, 191, 36, 0.08); }
          100% { box-shadow: 0 16px 36px rgba(251, 191, 36, 0.22); }
        }

        .b-winner-title {
          font-size: 1.5rem;
          font-weight: 850;
          margin: 0 0 0.5rem;
          background: linear-gradient(to right, #fbbf24, #f59e0b, #d97706);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
        }

        .b-winner-creator {
          font-size: 1.15rem;
          color: #ffffff;
          margin-bottom: 1.25rem;
          display: block;
          font-weight: 750;
        }

        .b-winner-link {
          display: inline-flex;
          align-items: center;
          gap: 0.5rem;
          color: #fbbf24;
          font-weight: 700;
          font-size: 0.95rem;
          text-decoration: none;
          transition: all 0.2s ease;
        }

        .b-winner-link:hover {
          color: #ffffff;
          transform: translateX(4px);
        }

        .btn-view-winner-trigger {
          background: linear-gradient(135deg, #f59e0b, #d97706);
          color: #ffffff;
          border: none;
          border-radius: 14px;
          padding: 0.85rem 1.75rem;
          font-size: 0.9rem;
          font-weight: 750;
          cursor: pointer;
          box-shadow: 0 4px 15px rgba(245, 158, 11, 0.35);
          margin-bottom: 2.2rem;
          transition: all 0.25s ease;
        }

        .btn-view-winner-trigger:hover {
          transform: translateY(-2px);
          box-shadow: 0 8px 24px rgba(245, 158, 11, 0.5);
        }

        /* Creator Submissions Cards */
        .b-submission-card {
          background: rgba(255, 255, 255, 0.02);
          backdrop-filter: blur(16px);
          -webkit-backdrop-filter: blur(16px);
          border: 1px solid rgba(255, 255, 255, 0.06);
          border-radius: 24px;
          padding: 1.8rem;
          box-shadow: 0 8px 24px rgba(0, 0, 0, 0.25);
          transition: all 0.3s cubic-bezier(0.16, 1, 0.3, 1);
          display: flex;
          flex-direction: column;
          justify-content: space-between;
          min-height: 190px;
        }

        .b-submission-card:hover {
          transform: translateY(-5px);
          border-color: rgba(255, 255, 255, 0.15);
          box-shadow: 0 15px 35px rgba(0, 0, 0, 0.35);
        }

        .submission-top {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 1rem;
          margin-bottom: 1.5rem;
        }

        .submission-creator {
          display: flex;
          align-items: center;
          gap: 0.85rem;
        }

        .avatar-initial {
          width: 44px;
          height: 44px;
          border-radius: 50%;
          display: grid;
          place-items: center;
          font-weight: 800;
          color: #ffffff;
          background: linear-gradient(135deg, #a855f7, #6366f1);
          box-shadow: 0 4px 10px rgba(124, 237, 185, 0.2);
          font-size: 1.15rem;
          flex-shrink: 0;
        }

        .submission-creator-meta {
          display: flex;
          flex-direction: column;
        }

        .submission-creator-label {
          font-size: 0.68rem;
          text-transform: uppercase;
          letter-spacing: 0.03em;
          color: var(--b-text-muted);
        }

        .submission-creator-name {
          font-size: 1rem;
          font-weight: 750;
          color: #ffffff;
        }

        .winner-badge {
          background: rgba(251, 191, 36, 0.15);
          border: 1px solid rgba(251, 191, 36, 0.3);
          color: #fbbf24;
          padding: 0.3rem 0.75rem;
          font-size: 0.7rem;
          font-weight: 750;
          border-radius: 99px;
          text-transform: uppercase;
          letter-spacing: 0.05em;
        }

        .submission-actions {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 1rem;
          padding-top: 1rem;
          border-top: 1px solid rgba(255, 255, 255, 0.05);
        }

        .submission-view-link {
          color: #c084fc;
          font-weight: 700;
          font-size: 0.9rem;
          text-decoration: none;
          transition: all 0.2s ease;
          display: inline-flex;
          align-items: center;
          gap: 0.25rem;
        }

        .submission-view-link:hover {
          color: #ffffff;
          transform: translateX(3px);
        }

        .select-winner-btn {
          background: linear-gradient(135deg, #fbbf24, #d97706);
          color: #ffffff;
          border: none;
          border-radius: 12px;
          padding: 0.6rem 1.15rem;
          font-size: 0.85rem;
          font-weight: 750;
          cursor: pointer;
          transition: all 0.25s ease;
          box-shadow: 0 4px 10px rgba(245, 158, 11, 0.2);
        }

        .select-winner-btn:hover {
          transform: translateY(-2px);
          box-shadow: 0 6px 15px rgba(245, 158, 11, 0.4);
        }

        /* Empty States */
        .b-empty-state {
          text-align: center;
          padding: 4rem 2rem;
          color: var(--b-text-muted);
          border: 1px dashed rgba(255, 255, 255, 0.08);
          border-radius: 24px;
          margin-top: 1.5rem;
          backdrop-filter: blur(10px);
          background: rgba(255, 255, 255, 0.005);
        }

        .b-empty-icon {
          font-size: 3.5rem;
          margin-bottom: 1.25rem;
          display: block;
          opacity: 0.8;
        }

        .b-empty-title {
          font-size: 1.4rem;
          font-weight: 750;
          color: #ffffff;
          margin: 0 0 0.5rem;
        }

        .b-empty-desc {
          font-size: 0.95rem;
          margin: 0;
        }

        /* Shimmer loading */
        .b-shimmer-card {
          height: 310px;
          border-radius: 24px;
          background: linear-gradient(90deg, rgba(255,255,255,0.02) 25%, rgba(255,255,255,0.06) 50%, rgba(255,255,255,0.02) 75%);
          background-size: 200% 100%;
          animation: loading-shimmer 1.4s infinite;
        }

        @keyframes loading-shimmer {
          0% { background-position: 200% 0; }
          100% { background-position: -200% 0; }
        }
      `}</style>

      {/* Decorative Glow Blobs */}
      <div className="b-ambient-glow b-glow-purple"></div>
      <div className="b-ambient-glow b-glow-blue"></div>
      <div className="b-ambient-glow b-glow-pink"></div>

      <div className="b-container">
        {/* HERO BANNER */}
        <div className="b-hero">
          <div className="b-hero-text">
            <h2 className="b-hero-title">🏢 Brand Dashboard</h2>
            <p className="b-hero-subtitle">
              Establish campaigns, discover creative talent, and select winning content partnerships.
            </p>
          </div>
          {brandNetTotal != null && (
            <div className="b-stats-grid">
              <div className="b-stat-card" title="3% commission will be deducted from your brand budget based on listed campaign rewards.">
                <h4 className="b-stat-label">Remaining Budget</h4>
                <span className="b-stat-value">₹{brandNetTotal.toLocaleString("en-IN")}</span>
              </div>
              <div className="b-stat-card">
                <h4 className="b-stat-label">Your Campaigns</h4>
                <span className="b-stat-value">
                  {loading ? "-" : campaigns.filter((c) => c && c._id && isCampaignOwnedByCurrentBrand(c)).length}
                </span>
              </div>
            </div>
          )}
        </div>

        {/* CAMPAIGN CREATION & LIST VIEW */}
        {!selectedCampaign && (
          <>
            {/* Create Campaign Card */}
            <div className="b-create-panel">
              <div className="b-create-header">
                <h3 className="b-create-title">Launch a Campaign Brief</h3>
                <p className="b-create-desc">Define your campaign requirements, rewards, and timeline to attract high-quality creator submissions.</p>
              </div>

              <form onSubmit={handleCreate}>
                <div className="b-form-group">
                  <label className="b-label">Campaign Title</label>
                  <input
                    type="text"
                    name="title"
                    placeholder="e.g. Summer Launch Campaign"
                    value={form.title}
                    onChange={(e) => handleChange("title", e.target.value)}
                    onBlur={handleBlur}
                    className="b-input"
                    required
                  />
                  {touched.title && formErrors.title && (
                    <span className="b-error-msg">{formErrors.title}</span>
                  )}
                </div>

                <div className="b-form-group">
                  <label className="b-label">Detailed Brief & Requirements</label>
                  <textarea
                    name="description"
                    placeholder="What should creators make? List down guidelines, video topics, resolution details..."
                    value={form.description}
                    onChange={(e) => handleChange("description", e.target.value)}
                    onBlur={handleBlur}
                    className="b-textarea"
                    required
                  />
                  {touched.description && formErrors.description && (
                    <span className="b-error-msg">{formErrors.description}</span>
                  )}
                </div>

                <div className="b-input-row">
                  <div className="b-form-group">
                    <label className="b-label">Reward Amount</label>
                    <input
                      type="text"
                      name="reward"
                      placeholder="e.g. ₹5000"
                      value={form.reward}
                      onChange={(e) => handleChange("reward", e.target.value)}
                      onBlur={handleBlur}
                      className="b-input"
                      required
                    />
                    {touched.reward && formErrors.reward && (
                      <span className="b-error-msg">{formErrors.reward}</span>
                    )}
                  </div>

                  <div className="b-form-group">
                    <label className="b-label">Submission Deadline</label>
                    <input
                      type="date"
                      name="deadline"
                      min={getTomorrowDateString()}
                      value={form.deadline}
                      onChange={(e) => handleChange("deadline", e.target.value)}
                      onBlur={handleBlur}
                      className="b-input"
                      required
                    />
                    {touched.deadline && formErrors.deadline && (
                      <span className="b-error-msg">{formErrors.deadline}</span>
                    )}
                  </div>
                </div>

                <button 
                  type="submit" 
                  className="btn-launch-neon"
                  disabled={isFormInvalid()}
                  style={{ marginTop: "1rem" }}
                >
                  🚀 Launch Campaign Brief
                </button>
              </form>
            </div>

            {/* Owned Campaigns List */}
            <h3 className="b-section-title">Campaigns created by you</h3>
            
            {loading ? (
              <div className="b-grid">
                <div className="b-shimmer-card"></div>
                <div className="b-shimmer-card"></div>
              </div>
            ) : campaigns.filter((c) => c && c._id && isCampaignOwnedByCurrentBrand(c)).length === 0 ? (
              <div className="b-empty-state">
                <span className="b-empty-icon">📁</span>
                <h3 className="b-empty-title">No Active Campaigns</h3>
                <p className="b-empty-desc">You haven't created any campaigns yet. Launch one above!</p>
              </div>
            ) : (
              <div className="b-grid">
                {campaigns
                  .filter((c) => c && c._id && isCampaignOwnedByCurrentBrand(c))
                  .map((c) => (
                    <div className="b-campaign-card" key={c._id}>
                      <div>
                        <div className="b-card-header">
                          <h3 className="b-card-title">{c.title || "Untitled Campaign"}</h3>
                          {c.status && (
                            <span className={c.status === "approved" ? "b-badge-approved" : "b-badge-pending"}>
                              {c.status === "pending" && "Pending Approval"}
                              {c.status === "approved" && "Approved"}
                            </span>
                          )}
                        </div>

                        <p className="b-card-desc">
                          {shortDescription(c.description, 110)}
                        </p>
                      </div>

                      <div>
                        <div className="b-card-meta">
                          {c.reward && (
                            <div className="b-meta-item">
                              <span>💰</span>
                              <span>Reward: <strong>{c.reward}</strong></span>
                            </div>
                          )}
                          {c.deadline && (
                            <div className="b-meta-item">
                              <span>📅</span>
                              <span>Deadline: <strong>{new Date(c.deadline).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}</strong></span>
                            </div>
                          )}
                        </div>

                        <button
                          type="button"
                          className="btn-view-submissions"
                          onClick={() => openSubmissions(c)}
                        >
                          View Submissions
                        </button>
                      </div>
                    </div>
                  ))}
              </div>
            )}
          </>
        )}

        {/* CAMPAIGN SUBMISSIONS VIEW */}
        {selectedCampaign && (
          <>
            <button
              type="button"
              className="btn-back-ghost"
              onClick={() => {
                setSelectedCampaign(null);
                setShowWinner(false);
                setShowConfetti(false);
              }}
            >
              ← Back to Campaigns Panel
            </button>

            <h3 className="b-section-title" style={{ marginBottom: "1.5rem" }}>
              Submissions for: <span style={{ color: "#c084fc" }}>{selectedCampaign.title}</span>
            </h3>

            {winner && !showWinner && (
              <button
                type="button"
                className="btn-view-winner-trigger"
                onClick={viewWinner}
              >
                View Selected Winner 🎉
              </button>
            )}

            {/* Winner Banner */}
            {winner && showWinner && (
              <div className="b-winner-banner">
                <div className="b-winner-content">
                  <h3 className="b-winner-title">🏆 Campaign Winner Crowned!</h3>
                  <span className="b-winner-creator">Creator: {winner.creator?.name || "Unknown Creator"}</span>
                  <a
                    href={winner.contentUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="b-winner-link"
                  >
                    View Winning Content Submission →
                  </a>
                </div>
              </div>
            )}

            {/* Submissions List Grid */}
            {submissions.length === 0 ? (
              <div className="b-empty-state">
                <span className="b-empty-icon">📥</span>
                <h3 className="b-empty-title">No Pitches Received</h3>
                <p className="b-empty-desc">No content submissions have been received for this campaign brief yet.</p>
              </div>
            ) : (
              <div className="b-grid">
                {submissions.map((s) => (
                  <div className="b-submission-card" key={s._id}>
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
                        <span className="winner-badge">🏆 Winner</span>
                      ) : (
                        <span className="b-badge-pending" style={{ fontSize: "0.7rem", padding: "0.2rem 0.5rem" }}>
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
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default BrandDashboard;
