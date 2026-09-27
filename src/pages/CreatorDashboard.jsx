import { useEffect, useState } from "react";
import api from "../api/axios";
import { toast } from "react-toastify";
import {
  getCampaignIdFromRef,
  prizeForWin,
  titleForWin,
} from "../utils/creatorPrizes";

const CreatorDashboard = () => {
  const [campaigns, setCampaigns] = useState([]);
  const [mySubmissions, setMySubmissions] = useState([]);
  const [wins, setWins] = useState([]);
  const [selectedCampaign, setSelectedCampaign] = useState(null);
  const [viewCampaign, setViewCampaign] = useState(null);
  const [contentUrl, setContentUrl] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        const [campaignsRes, submissionsRes, winsRes] = await Promise.all([
          api.get("/api/campaigns"),
          api.get("/api/submissions/mine"),
          api.get("/api/submissions/my-wins"),
        ]);

        setCampaigns(campaignsRes.data || []);
        setMySubmissions(submissionsRes.data || []);
        setWins(winsRes.data || []);
      } catch (err) {
        console.error("Failed to load dashboard data:", err);
        toast.error("Failed to load dashboard data");
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, []);

  const hasSubmitted = (campaignId) =>
    mySubmissions.some(
      (s) => getCampaignIdFromRef(s.campaign) === String(campaignId)
    );

  const formatDeadline = (value) => {
    if (!value) return "Not specified";
    const d = new Date(value);
    if (Number.isNaN(d.getTime())) return String(value);
    return d.toLocaleDateString(undefined, {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  };

  const shortDescription = (text, maxChars = 110) => {
    const s = (text ?? "").toString().trim();
    if (!s) return "No description available";
    if (s.length <= maxChars) return s;
    const cut = s.slice(0, maxChars);
    const lastSpace = cut.lastIndexOf(" ");
    return `${cut.slice(0, lastSpace > 40 ? lastSpace : maxChars).trim()}...`;
  };

  const closeModal = () => {
    setSelectedCampaign(null);
    setContentUrl("");
  };

  const submitContent = async (e) => {
    e.preventDefault();

    try {
      await api.post("/api/submissions", {
        campaignId: selectedCampaign._id,
        contentUrl,
      });

      toast.success("Content submitted successfully!");
      closeModal();

      const res = await api.get("/api/submissions/mine");
      setMySubmissions(res.data || []);
    } catch (err) {
      toast.error(err.response?.data?.message || "Submission failed");
    }
  };

  return (
    <div className="creator-dashboard-root">
      <style>{`
        /* High-end executive dark theme for Creator Dashboard */
        .creator-dashboard-root {
          --c-bg: #070514;
          --c-surface: rgba(255, 255, 255, 0.03);
          --c-surface-hover: rgba(255, 255, 255, 0.06);
          --c-border: rgba(255, 255, 255, 0.06);
          --c-border-hover: rgba(168, 85, 247, 0.4);
          --c-primary: #7c3aed;
          --c-primary-glow: rgba(124, 58, 237, 0.3);
          --c-gold: #fbbf24;
          --c-gold-glow: rgba(251, 191, 36, 0.2);
          --c-text-main: #f3f4f6;
          --c-text-muted: #9ca3af;
          
          background-color: var(--c-bg) !important;
          color: var(--c-text-main) !important;
          min-height: calc(100vh - 74px);
          position: relative;
          overflow: hidden;
          font-family: 'Outfit', 'Plus Jakarta Sans', 'Inter', sans-serif;
        }

        /* Ambient background glow */
        .c-ambient-glow {
          position: absolute;
          border-radius: 50%;
          filter: blur(140px);
          opacity: 0.45;
          pointer-events: none;
          z-index: 0;
        }
        
        .glow-purple {
          width: 500px;
          height: 500px;
          background: radial-gradient(circle, #8b5cf6 0%, transparent 70%);
          top: -15%;
          left: -10%;
          animation: float-glow-1 20s infinite alternate ease-in-out;
        }
        
        .glow-blue {
          width: 600px;
          height: 600px;
          background: radial-gradient(circle, #3b82f6 0%, transparent 70%);
          bottom: -15%;
          right: -10%;
          animation: float-glow-2 25s infinite alternate ease-in-out;
        }
        
        .glow-pink {
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

        .c-container {
          max-width: 1280px;
          margin: 0 auto;
          padding: 3rem 1.5rem;
          position: relative;
          z-index: 1;
        }

        /* Command Hero Card */
        .c-hero {
          background: linear-gradient(135deg, rgba(20, 15, 50, 0.4), rgba(40, 15, 80, 0.2)) !important;
          backdrop-filter: blur(16px) !important;
          -webkit-backdrop-filter: blur(16px) !important;
          border: 1px solid var(--c-border) !important;
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

        .c-hero::before {
          content: '';
          position: absolute;
          top: 0; left: 0; right: 0; bottom: 0;
          background: radial-gradient(circle at 0% 0%, rgba(139, 92, 246, 0.12), transparent 50%);
          pointer-events: none;
        }

        @media (max-width: 768px) {
          .c-hero {
            flex-direction: column;
            align-items: flex-start;
            gap: 1.5rem;
            padding: 2rem;
          }
        }

        .c-hero-title {
          font-size: 2.6rem;
          font-weight: 850;
          margin: 0 0 0.5rem;
          background: linear-gradient(to right, #ffffff, #c084fc, #818cf8);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          letter-spacing: -0.03em;
        }

        .c-hero-subtitle {
          font-size: 1.1rem;
          color: var(--c-text-muted);
          margin: 0;
          font-weight: 500;
          max-width: 600px;
          line-height: 1.6;
        }

        /* Glass Widgets Grid */
        .c-stats-grid {
          display: flex;
          gap: 1.5rem;
          flex-wrap: wrap;
        }

        .c-stat-card {
          background: rgba(255, 255, 255, 0.02);
          backdrop-filter: blur(10px);
          -webkit-backdrop-filter: blur(10px);
          border: 1px solid var(--c-border);
          border-radius: 20px;
          padding: 1.1rem 2rem;
          min-width: 170px;
          text-align: center;
          box-shadow: 0 4px 20px rgba(0, 0, 0, 0.2);
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
          position: relative;
        }

        .c-stat-card::after {
          content: '';
          position: absolute;
          top: 0; left: 0; width: 100%; height: 3px;
          background: linear-gradient(90deg, #a855f7, #6366f1);
          opacity: 0.8;
        }

        .c-stat-card:hover {
          transform: translateY(-4px);
          border-color: var(--c-border-hover);
          box-shadow: 0 10px 25px var(--c-primary-glow);
        }

        .c-stat-label {
          font-size: 0.72rem;
          text-transform: uppercase;
          color: var(--c-text-muted);
          font-weight: 700;
          letter-spacing: 0.08em;
          margin-bottom: 0.4rem;
        }

        .c-stat-value {
          font-size: 2.1rem;
          font-weight: 900;
          color: #ffffff;
          line-height: 1.1;
        }

        /* Congratulations Glass Banner */
        .c-congrats-card {
          background: linear-gradient(135deg, rgba(251, 191, 36, 0.08), rgba(217, 119, 6, 0.03)) !important;
          backdrop-filter: blur(20px);
          -webkit-backdrop-filter: blur(20px);
          border: 1px solid rgba(251, 191, 36, 0.3) !important;
          border-radius: 24px;
          padding: 1.8rem 2.5rem;
          margin-bottom: 3.5rem;
          display: flex;
          align-items: center;
          gap: 1.75rem;
          box-shadow: 
            0 10px 30px rgba(0, 0, 0, 0.2),
            inset 0 1px 0 rgba(255, 255, 255, 0.05);
          position: relative;
          overflow: hidden;
        }

        .c-congrats-card::before {
          content: '';
          position: absolute;
          top: 0; left: 0; right: 0; bottom: 0;
          background: radial-gradient(circle at 100% 100%, rgba(251, 191, 36, 0.08), transparent 50%);
          pointer-events: none;
        }

        .c-congrats-icon-box {
          font-size: 3.2rem;
          animation: c-bounce 2s infinite alternate ease-in-out;
        }

        @keyframes c-bounce {
          0% { transform: translateY(0) rotate(0deg); }
          100% { transform: translateY(-8px) rotate(5deg); }
        }

        .c-congrats-info h3 {
          font-size: 1.5rem;
          font-weight: 850;
          margin: 0 0 0.35rem;
          background: linear-gradient(to right, #fbbf24, #f59e0b, #d97706);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
        }

        .c-congrats-info p {
          font-size: 1.05rem;
          color: #f3f4f6;
          margin: 0;
          font-weight: 500;
        }

        .c-congrats-info strong {
          color: #fbbf24;
          font-weight: 800;
        }

        /* Achievements / Wins Cards */
        .c-win-card {
          background: rgba(251, 191, 36, 0.015);
          backdrop-filter: blur(16px);
          -webkit-backdrop-filter: blur(16px);
          border: 1px solid rgba(251, 191, 36, 0.15);
          border-radius: 24px;
          padding: 2rem;
          display: flex;
          flex-direction: column;
          justify-content: space-between;
          min-height: 240px;
          transition: all 0.4s cubic-bezier(0.16, 1, 0.3, 1);
          box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
          position: relative;
        }

        .c-win-card::before {
          content: '';
          position: absolute;
          top: 0; left: 0; right: 0; bottom: 0;
          border-radius: 24px;
          background: radial-gradient(circle at 100% 0%, rgba(251, 191, 36, 0.06), transparent 60%);
          pointer-events: none;
        }

        .c-win-card:hover {
          transform: translateY(-6px);
          border-color: rgba(251, 191, 36, 0.4);
          box-shadow: 
            0 20px 40px rgba(0, 0, 0, 0.4),
            0 0 25px rgba(251, 191, 36, 0.1);
        }

        .c-win-header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          gap: 1.25rem;
          margin-bottom: 0.75rem;
        }

        .c-win-title {
          font-size: 1.3rem;
          font-weight: 850;
          color: #ffffff;
          margin: 0;
          line-height: 1.35;
          letter-spacing: -0.01em;
        }

        .c-badge-win {
          background: rgba(251, 191, 36, 0.12);
          border: 1px solid rgba(251, 191, 36, 0.3);
          color: #fbbf24;
          padding: 0.3rem 0.75rem;
          font-size: 0.7rem;
          font-weight: 750;
          border-radius: 99px;
          text-transform: uppercase;
          letter-spacing: 0.05em;
          flex-shrink: 0;
        }

        .c-win-desc {
          font-size: 0.95rem;
          color: var(--c-text-muted);
          line-height: 1.5;
          margin-bottom: 1.5rem;
        }

        .c-win-prize-row {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding-top: 1rem;
          border-top: 1px solid rgba(255, 255, 255, 0.05);
          margin-bottom: 1.5rem;
        }

        .c-win-prize-label {
          font-size: 0.75rem;
          color: var(--c-text-muted);
          text-transform: uppercase;
          letter-spacing: 0.05em;
        }

        .c-win-prize-value {
          font-size: 1.2rem;
          font-weight: 900;
          color: #fbbf24;
        }

        /* Sections */
        .creator-section {
          margin-bottom: 3.5rem;
        }

        .creator-section-title {
          font-size: 1.5rem;
          font-weight: 800;
          color: #ffffff;
          margin: 0 0 1.5rem;
          letter-spacing: -0.015em;
          display: flex;
          align-items: center;
          gap: 0.6rem;
        }

        /* Grid */
        .creator-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(330px, 1fr));
          gap: 2rem;
        }

        /* Available Campaigns Cards */
        .c-campaign-card {
          background: var(--c-surface);
          backdrop-filter: blur(16px);
          -webkit-backdrop-filter: blur(16px);
          border: 1px solid var(--c-border);
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

        .c-campaign-card::before {
          content: '';
          position: absolute;
          top: 0; left: 0; right: 0; bottom: 0;
          border-radius: 24px;
          background: radial-gradient(circle at 100% 0%, rgba(139, 92, 246, 0.08), transparent 60%);
          pointer-events: none;
        }

        .c-campaign-card:hover {
          transform: translateY(-6px);
          border-color: var(--c-border-hover);
          box-shadow: 
            0 20px 40px rgba(0, 0, 0, 0.35),
            0 0 25px rgba(124, 58, 237, 0.12);
        }

        .c-card-header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          gap: 1.25rem;
          margin-bottom: 1.1rem;
        }

        .c-card-title {
          font-size: 1.3rem;
          font-weight: 800;
          color: #ffffff;
          margin: 0;
          line-height: 1.35;
          letter-spacing: -0.015em;
        }

        .c-card-reward {
          font-size: 1.2rem;
          font-weight: 900;
          color: #c084fc;
          flex-shrink: 0;
        }

        .c-card-desc {
          font-size: 0.95rem;
          color: var(--c-text-muted);
          line-height: 1.6;
          margin-bottom: 1.75rem;
          flex-grow: 1;
        }

        .c-card-meta {
          display: flex;
          flex-direction: column;
          gap: 0.5rem;
          padding-top: 1rem;
          border-top: 1px solid rgba(255, 255, 255, 0.05);
          margin-bottom: 1.5rem;
        }

        .c-meta-item {
          display: flex;
          align-items: center;
          gap: 0.6rem;
          font-size: 0.88rem;
          color: var(--c-text-muted);
        }

        .c-meta-item strong {
          color: #f3f4f6;
          font-weight: 600;
        }

        .c-card-actions {
          display: flex;
          gap: 1rem;
          width: 100%;
        }

        /* Buttons styling */
        .btn-neon-action {
          flex: 1.25;
          background: linear-gradient(135deg, #7c3aed, #4f46e5);
          color: #ffffff;
          border: none;
          border-radius: 14px;
          padding: 0.85rem 1.5rem;
          font-size: 0.9rem;
          font-weight: 750;
          cursor: pointer;
          box-shadow: 0 4px 15px rgba(124, 58, 237, 0.3);
          transition: all 0.25s ease;
          text-align: center;
        }

        .btn-neon-action:hover {
          transform: translateY(-2px);
          box-shadow: 
            0 8px 24px rgba(124, 58, 237, 0.5),
            0 0 15px rgba(99, 102, 241, 0.3);
        }

        .badge-submitted-green {
          flex: 1.25;
          background: rgba(16, 185, 129, 0.12);
          border: 1px solid rgba(16, 185, 129, 0.3);
          color: #34d399;
          border-radius: 14px;
          padding: 0.85rem;
          font-size: 0.88rem;
          font-weight: 750;
          text-align: center;
          text-transform: uppercase;
          letter-spacing: 0.05em;
        }

        .btn-ghost-action {
          flex: 1;
          background: rgba(255, 255, 255, 0.04);
          color: #ffffff;
          border: 1px solid rgba(255, 255, 255, 0.12);
          border-radius: 14px;
          padding: 0.85rem 1.25rem;
          font-size: 0.9rem;
          font-weight: 650;
          cursor: pointer;
          transition: all 0.25s ease;
          text-align: center;
        }

        .btn-ghost-action:hover {
          background: rgba(255, 255, 255, 0.08);
          border-color: rgba(255, 255, 255, 0.25);
          transform: translateY(-2px);
        }

        /* Glassmorphic Modals */
        .c-modal-overlay {
          position: fixed;
          top: 0; left: 0; right: 0; bottom: 0;
          background: rgba(6, 4, 14, 0.88);
          backdrop-filter: blur(16px);
          -webkit-backdrop-filter: blur(16px);
          display: grid;
          place-items: center;
          z-index: 1000;
          padding: 1.5rem;
          animation: fade-in 0.25s cubic-bezier(0.16, 1, 0.3, 1) both;
        }

        .c-modal {
          background: rgba(16, 12, 30, 0.98);
          border: 1px solid var(--c-border);
          box-shadow: 
            0 30px 60px rgba(0, 0, 0, 0.6),
            0 0 40px rgba(139, 92, 246, 0.2);
          border-radius: 28px;
          max-width: 550px;
          width: 100%;
          padding: 2.5rem;
          position: relative;
          animation: scale-up 0.35s cubic-bezier(0.34, 1.56, 0.64, 1) both;
        }

        .c-modal-close {
          position: absolute;
          top: 1.25rem; right: 1.25rem;
          background: rgba(255, 255, 255, 0.05) !important;
          border: none !important;
          width: 36px !important; height: 36px !important;
          border-radius: 50% !important;
          padding: 0 !important;
          color: #ffffff !important;
          display: grid !important;
          place-items: center !important;
          font-size: 1rem !important;
          cursor: pointer !important;
          transition: all 0.2s ease !important;
        }

        .c-modal-close:hover {
          background: rgba(255, 255, 255, 0.15);
          transform: rotate(90deg);
        }

        .c-modal-title {
          font-size: 1.75rem;
          font-weight: 850;
          color: #ffffff;
          margin: 0 0 1.5rem;
          line-height: 1.3;
          letter-spacing: -0.015em;
        }

        .c-modal-body {
          font-size: 1.02rem;
          line-height: 1.7;
          color: #d1d5db;
          margin-bottom: 2rem;
          max-height: 250px;
          overflow-y: auto;
          padding-right: 0.5rem;
        }

        .c-modal-body::-webkit-scrollbar {
          width: 6px;
        }
        .c-modal-body::-webkit-scrollbar-thumb {
          background: rgba(255, 255, 255, 0.1);
          border-radius: 99px;
        }

        .c-modal-meta-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 1.25rem;
          padding: 1.1rem;
          background: rgba(255, 255, 255, 0.01);
          border: 1px solid rgba(255, 255, 255, 0.04);
          border-radius: 16px;
          margin-bottom: 2rem;
        }

        .c-modal-meta-item h6 {
          font-size: 0.68rem;
          text-transform: uppercase;
          color: var(--c-text-muted);
          margin: 0 0 0.3rem;
          letter-spacing: 0.05em;
        }

        .c-modal-meta-item p {
          font-size: 1rem;
          font-weight: 700;
          color: #ffffff;
          margin: 0;
        }

        .c-modal-meta-item p.highlight {
          color: #c084fc;
        }

        /* Glass Input inside Modal */
        .c-input {
          background: rgba(255, 255, 255, 0.02) !important;
          border: 1px solid rgba(255, 255, 255, 0.08) !important;
          border-radius: 14px !important;
          padding: 0.9rem 1.1rem !important;
          color: #ffffff !important;
          font-size: 0.95rem !important;
          width: 100% !important;
          margin-bottom: 1rem !important;
          transition: all 0.25s ease !important;
        }

        .c-input:focus {
          border-color: #a855f7 !important;
          box-shadow: 0 0 12px rgba(168, 85, 247, 0.2) !important;
          outline: none !important;
        }

        /* Instruction Box */
        .c-instruction-box {
          margin-top: 1rem;
          padding: 1.25rem;
          border: 1px solid rgba(255, 255, 255, 0.05);
          border-radius: 16px;
          background: rgba(255, 255, 255, 0.005);
        }

        .c-instruction-box p {
          margin: 0;
          font-weight: 800;
          color: #c084fc;
          font-size: 0.92rem;
          letter-spacing: 0.02em;
          text-transform: uppercase;
        }

        .c-instruction-box ul {
          margin: 0.75rem 0 0;
          padding-left: 1.1rem;
          font-size: 0.88rem;
          color: var(--c-text-muted);
          line-height: 1.6;
        }

        .c-instruction-box li {
          margin-bottom: 0.35rem;
        }

        .c-fee-note {
          font-size: 0.82rem;
          color: var(--c-text-muted);
          margin-top: 1rem;
          font-style: italic;
        }

        /* Shimmer Loading */
        .c-shimmer-card {
          height: 290px;
          border-radius: 20px;
          background: linear-gradient(90deg, rgba(255,255,255,0.02) 25%, rgba(255,255,255,0.06) 50%, rgba(255,255,255,0.02) 75%);
          background-size: 200% 100%;
          animation: loading-shimmer 1.4s infinite;
        }

        @keyframes loading-shimmer {
          0% { background-position: 200% 0; }
          100% { background-position: -200% 0; }
        }

        /* Empty State */
        .c-empty-state {
          background: rgba(255, 255, 255, 0.02);
          border: 1px dashed rgba(255, 255, 255, 0.1);
          border-radius: 24px;
          padding: 5rem 2rem;
          text-align: center;
          max-width: 550px;
          margin: 4rem auto;
          box-shadow: 0 10px 30px rgba(0, 0, 0, 0.2);
          backdrop-filter: blur(10px);
        }

        .c-empty-icon {
          font-size: 3.5rem;
          margin-bottom: 1.25rem;
          display: block;
          animation: pulse-icon 2s infinite alternate ease-in-out;
        }

        @keyframes pulse-icon {
          0% { transform: scale(1); opacity: 0.7; }
          100% { transform: scale(1.08); opacity: 1; }
        }

        .c-empty-title {
          font-size: 1.45rem;
          font-weight: 750;
          color: #ffffff;
          margin: 0 0 0.5rem;
        }

        .c-empty-desc {
          font-size: 0.95rem;
          color: var(--c-text-muted);
          margin: 0;
        }
      `}</style>

      {/* Decorative Glow Blobs */}
      <div className="c-ambient-glow glow-purple"></div>
      <div className="c-ambient-glow glow-blue"></div>
      <div className="c-ambient-glow glow-pink"></div>

      <div className="c-container">
        {/* HERO SECTION */}
        <div className="c-hero">
          <div className="c-hero-text">
            <h2 className="c-hero-title">🎨 Creator Command Center</h2>
            <p className="c-hero-subtitle">
              Discover campaigns, showcase your creativity, and forge spectacular partnerships.
            </p>
          </div>
          
          <div className="c-stats-grid">
            <div className="c-stat-card">
              <h4 className="c-stat-label">Total Wins</h4>
              <span className="c-stat-value">{loading ? "-" : wins.length}</span>
            </div>
            <div className="c-stat-card">
              <h4 className="c-stat-label">Open Campaigns</h4>
              <span className="c-stat-value">
                {loading ? "-" : campaigns.filter((c) => c && c._id).length}
              </span>
            </div>
          </div>
        </div>

        {/* CONGRATULATIONS BANNER */}
        {!loading && wins.length > 0 && (
          <div className="c-congrats-card">
            <span className="c-congrats-icon-box">🏆</span>
            <div className="c-congrats-info">
              <h3>Achievements Unlocked!</h3>
              <p>
                Congratulations! You have secured <strong>{wins.length}</strong> brand campaign partnership{wins.length === 1 ? "" : "s"} so far. Keep showcasing your spectacular talent!
              </p>
            </div>
          </div>
        )}

        {/* MY WINS SECTION */}
        {!loading && wins.length > 0 && (
          <div className="creator-section">
            <h3 className="creator-section-title">🏆 My Wins & Earnings</h3>
            <div className="creator-grid">
              {wins.map((w) => (
                <div className="c-win-card" key={w._id}>
                  <div>
                    <div className="c-win-header">
                      <h3 className="c-win-title">{titleForWin(w, campaigns)}</h3>
                      <span className="c-badge-win">Winner</span>
                    </div>
                    <p className="c-win-desc">🎉 Your content has been chosen by the brand!</p>
                  </div>
                  <div>
                    {prizeForWin(w, campaigns) && (
                      <div className="c-win-prize-row">
                        <span className="c-win-prize-label">Payout Amount</span>
                        <span className="c-win-prize-value">{prizeForWin(w, campaigns)}*</span>
                      </div>
                    )}
                    <a
                      href={w.contentUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="btn-view-submission"
                    >
                      View Winning Submission
                    </a>
                  </div>
                </div>
              ))}
            </div>
            {wins.some((w) => prizeForWin(w, campaigns)) && (
              <p className="c-fee-note">
                * Note: A 5% platform fee will be automatically deducted upon withdrawal.
              </p>
            )}
          </div>
        )}

        {/* AVAILABLE CAMPAIGNS */}
        <div className="creator-section">
          <h3 className="creator-section-title">📢 Latest Campaign Briefs</h3>
          
          {loading ? (
            <div className="creator-grid">
              <div className="c-shimmer-card"></div>
              <div className="c-shimmer-card"></div>
              <div className="c-shimmer-card"></div>
            </div>
          ) : campaigns.length === 0 ? (
            <div className="c-empty-state">
              <span className="c-empty-icon">📂</span>
              <h3 className="c-empty-title">No Briefs Available</h3>
              <p className="c-empty-desc">Check back later for active campaign briefs!</p>
            </div>
          ) : (
            <div className="creator-grid">
              {campaigns
                .filter((c) => c && c._id)
                .map((c) => {
                  const submitted = hasSubmitted(c._id);

                  return (
                    <div className="c-campaign-card" key={c._id}>
                      <div>
                        <div className="c-card-header">
                          <h3 className="c-card-title">{c.title || "Untitled Campaign"}</h3>
                          {c.reward && <span className="c-card-reward">{c.reward}</span>}
                        </div>
                        <p className="c-card-desc">
                          {shortDescription(c.description)}
                        </p>
                      </div>

                      <div>
                        <div className="c-card-meta">
                          {c.deadline && (
                            <div className="c-meta-item">
                              <span>📅</span>
                              <span>Deadline: <strong>{formatDeadline(c.deadline)}</strong></span>
                            </div>
                          )}
                          <div className="c-meta-item">
                            <span>⚡</span>
                            <span>Status: <strong>{submitted ? "Submitted" : "Open for Pitching"}</strong></span>
                          </div>
                        </div>

                        <div className="c-card-actions">
                          {submitted ? (
                            <span className="badge-submitted-green">Submitted</span>
                          ) : (
                            <button
                              type="button"
                              className="btn-neon-action"
                              onClick={() => setSelectedCampaign(c)}
                            >
                              Submit Content
                            </button>
                          )}
                          <button
                            type="button"
                            className="btn-ghost-action"
                            onClick={() => setViewCampaign(c)}
                          >
                            Brief
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
            </div>
          )}
        </div>
      </div>

      {/* SUBMIT MODAL */}
      {selectedCampaign && (
        <div className="c-modal-overlay" onClick={closeModal}>
          <div className="c-modal" onClick={(e) => e.stopPropagation()}>
            <button className="c-modal-close" onClick={closeModal}>
              ✕
            </button>

            <h3 className="c-modal-title">Submit Pitch: {selectedCampaign.title}</h3>

            <form onSubmit={submitContent}>
              <input
                type="url"
                className="c-input"
                placeholder="Paste public Drive or Media link"
                value={contentUrl}
                onChange={(e) => setContentUrl(e.target.value)}
                required
              />

              <div className="c-instruction-box">
                <p>Submission Guidelines</p>
                <ul>
                  <li>Video quality should be at least 1080p (Full HD).</li>
                  <li>Keep video stable, well-focused, and properly lit.</li>
                  <li>Clear audio track with minimal background noise.</li>
                  <li>Ensure content matches the brief requirements.</li>
                  <li>Confirm drive link access is set to public.</li>
                </ul>
              </div>

              <button type="submit" className="btn-neon-action" style={{ marginTop: "1.5rem", width: "100%" }}>
                Submit Pitch
              </button>
            </form>
          </div>
        </div>
      )}

      {/* CAMPAIGN BRIEF DETAILS MODAL */}
      {viewCampaign && (
        <div
          className="c-modal-overlay"
          onClick={() => setViewCampaign(null)}
        >
          <div
            className="c-modal"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              className="c-modal-close"
              onClick={() => setViewCampaign(null)}
            >
              ✕
            </button>

            <h3 className="c-modal-title">{viewCampaign.title || "Untitled Brief"}</h3>

            <div className="c-modal-body">
              {viewCampaign.description || "No description available."}
            </div>

            <div className="c-modal-meta-grid">
              <div className="c-modal-meta-item">
                <h6>Reward Amount</h6>
                <p className="highlight">{viewCampaign.reward || "Not specified"}</p>
              </div>
              <div className="c-modal-meta-item">
                <h6>Deadline</h6>
                <p>{formatDeadline(viewCampaign.deadline)}</p>
              </div>
            </div>

            <div className="c-instruction-box" style={{ marginBottom: "1.5rem" }}>
              <p>Submission Requirements</p>
              <ul>
                <li>1080p (Full HD) minimum quality.</li>
                <li>Clear, well-focused audio and footage.</li>
                <li>Alignment with brief and brand tone.</li>
                <li>Public access for link verification.</li>
              </ul>
            </div>

            <div className="c-card-actions">
              <button 
                type="button" 
                className="btn-ghost-action" 
                onClick={() => setViewCampaign(null)}
                style={{ flex: 1 }}
              >
                Close Brief
              </button>
              {!hasSubmitted(viewCampaign._id) && (
                <button 
                  type="button" 
                  className="btn-neon-action" 
                  onClick={() => {
                    setViewCampaign(null);
                    setSelectedCampaign(viewCampaign);
                  }}
                  style={{ flex: 1.25 }}
                >
                  Submit Pitch Now
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CreatorDashboard;
