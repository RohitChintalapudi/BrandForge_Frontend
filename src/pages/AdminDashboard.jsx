import { useEffect, useState } from "react";
import api from "../api/axios";
import { toast } from "react-toastify";

const AdminDashboard = () => {
  const [campaigns, setCampaigns] = useState([]);
  const [approvedCount, setApprovedCount] = useState(0);
  const [viewCampaign, setViewCampaign] = useState(null);
  const [loading, setLoading] = useState(true);

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

  const shortDescription = (text, maxChars = 120) => {
    const s = (text ?? "").toString().trim();
    if (!s) return "No description available";
    if (s.length <= maxChars) return s;
    const cut = s.slice(0, maxChars);
    const lastSpace = cut.lastIndexOf(" ");
    return `${cut.slice(0, lastSpace > 40 ? lastSpace : maxChars).trim()}...`;
  };

  const fetchData = async () => {
    try {
      setLoading(true);
      const [pendingRes, approvedRes] = await Promise.all([
        api.get("/api/campaigns/pending"),
        api.get("/api/campaigns"),
      ]);
      setCampaigns(pendingRes.data);
      setApprovedCount(approvedRes.data.length);
    } catch {
      toast.error("Failed to load dashboard data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const approveCampaign = async (id) => {
    try {
      await api.put(`/api/campaigns/${id}/approve`);
      toast.success("Campaign approved successfully!");
      setCampaigns((prev) => prev.filter((c) => c._id !== id));
      setApprovedCount((prev) => prev + 1);
      setViewCampaign((v) => (v && v._id === id ? null : v));
    } catch {
      toast.error("Approval failed");
    }
  };

  return (
    <div className="admin-dashboard-root">
      <style>{`
        /* Glassmorphism theme specifically for Admin Dashboard */
        .admin-dashboard-root {
          --admin-bg: #0b081a;
          --admin-card-bg: rgba(255, 255, 255, 0.03);
          --admin-card-border: rgba(255, 255, 255, 0.08);
          --admin-card-hover-border: rgba(168, 85, 247, 0.4);
          --admin-text-main: #f3f4f6;
          --admin-text-muted: #9ca3af;
          
          background-color: var(--admin-bg) !important;
          color: var(--admin-text-main) !important;
          min-height: calc(100vh - 74px);
          position: relative;
          overflow: hidden;
          font-family: 'Outfit', 'Inter', sans-serif;
        }

        /* Background Glowing Blobs */
        .admin-glow-blob {
          position: absolute;
          border-radius: 50%;
          filter: blur(120px);
          opacity: 0.4;
          pointer-events: none;
          z-index: 0;
        }

        .blob-purple {
          width: 450px;
          height: 450px;
          background: radial-gradient(circle, rgba(124, 58, 237, 0.6) 0%, transparent 70%);
          top: -10%;
          left: -10%;
          animation: float-blob-1 15s infinite alternate ease-in-out;
        }

        .blob-indigo {
          width: 550px;
          height: 550px;
          background: radial-gradient(circle, rgba(79, 70, 229, 0.5) 0%, transparent 70%);
          bottom: -10%;
          right: -10%;
          animation: float-blob-2 18s infinite alternate ease-in-out;
        }

        .blob-pink {
          width: 380px;
          height: 380px;
          background: radial-gradient(circle, rgba(219, 39, 119, 0.4) 0%, transparent 70%);
          top: 35%;
          left: 45%;
          animation: float-blob-3 20s infinite alternate ease-in-out;
        }

        @keyframes float-blob-1 {
          0% { transform: translate(0, 0) scale(1); }
          100% { transform: translate(60px, 40px) scale(1.1); }
        }

        @keyframes float-blob-2 {
          0% { transform: translate(0, 0) scale(1.1); }
          100% { transform: translate(-80px, -50px) scale(0.95); }
        }

        @keyframes float-blob-3 {
          0% { transform: translate(0, 0) translate(-30px, 30px); }
          100% { transform: translate(0, 0) translate(30px, -30px); }
        }

        /* Main Layout */
        .admin-container {
          max-width: 1280px;
          margin: 0 auto;
          padding: 3rem 1.5rem;
          position: relative;
          z-index: 1;
        }

        /* Hero Section */
        .admin-hero {
          background: linear-gradient(135deg, rgba(25, 20, 60, 0.4), rgba(76, 29, 149, 0.15)) !important;
          backdrop-filter: blur(12px) !important;
          -webkit-backdrop-filter: blur(12px) !important;
          border: 1px solid var(--admin-card-border) !important;
          border-radius: 24px;
          padding: 2.2rem 3rem;
          margin-bottom: 3rem;
          display: flex;
          justify-content: space-between;
          align-items: center;
          position: relative;
          overflow: hidden;
          box-shadow: 0 8px 32px 0 rgba(0, 0, 0, 0.3);
        }

        @media (max-width: 768px) {
          .admin-hero {
            flex-direction: column;
            align-items: flex-start;
            gap: 1.5rem;
            padding: 2rem;
          }
        }

        .admin-hero-title {
          font-size: 2.3rem;
          font-weight: 850;
          margin: 0 0 0.5rem;
          background: linear-gradient(to right, #ffffff, #c084fc, #818cf8);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          letter-spacing: -0.03em;
        }

        .admin-hero-subtitle {
          font-size: 1.05rem;
          color: var(--admin-text-muted);
          margin: 0;
          font-weight: 500;
        }

        /* Stats Cards Grid */
        .admin-stats-grid {
          display: flex;
          gap: 1.25rem;
          flex-wrap: wrap;
        }

        .admin-stat-card {
          background: rgba(255, 255, 255, 0.02);
          backdrop-filter: blur(10px);
          -webkit-backdrop-filter: blur(10px);
          border: 1px solid var(--admin-card-border);
          border-radius: 16px;
          padding: 1rem 1.75rem;
          min-width: 150px;
          text-align: center;
          box-shadow: 0 4px 15px rgba(0, 0, 0, 0.15);
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
          position: relative;
        }

        .admin-stat-card::after {
          content: '';
          position: absolute;
          top: 0; left: 0; width: 100%; height: 3px;
          background: linear-gradient(90deg, #a855f7, #6366f1);
          opacity: 0.8;
        }

        .admin-stat-card:hover {
          transform: translateY(-3px);
          border-color: var(--admin-card-hover-border);
          box-shadow: 0 8px 24px rgba(124, 58, 237, 0.15);
        }

        .admin-stat-label {
          font-size: 0.7rem;
          text-transform: uppercase;
          color: var(--admin-text-muted);
          font-weight: 700;
          letter-spacing: 0.08em;
          margin-bottom: 0.35rem;
        }

        .admin-stat-value {
          font-size: 2rem;
          font-weight: 900;
          color: #ffffff;
          line-height: 1.1;
        }

        /* Campaign Grid & Cards */
        .admin-campaign-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(330px, 1fr));
          gap: 2rem;
        }

        .admin-campaign-card {
          background: var(--admin-card-bg);
          backdrop-filter: blur(16px);
          -webkit-backdrop-filter: blur(16px);
          border: 1px solid var(--admin-card-border);
          border-radius: 20px;
          padding: 1.8rem;
          display: flex;
          flex-direction: column;
          justify-content: space-between;
          min-height: 290px;
          box-shadow: 0 8px 32px 0 rgba(0, 0, 0, 0.25);
          transition: all 0.4s cubic-bezier(0.16, 1, 0.3, 1);
          position: relative;
        }

        .admin-campaign-card:hover {
          transform: translateY(-5px);
          border-color: var(--admin-card-hover-border);
          box-shadow: 
            0 15px 30px rgba(0, 0, 0, 0.35),
            0 0 20px rgba(124, 58, 237, 0.1);
        }

        .admin-card-top {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          gap: 1rem;
          margin-bottom: 1.1rem;
        }

        .admin-card-title {
          font-size: 1.25rem;
          font-weight: 750;
          margin: 0;
          color: #ffffff;
          line-height: 1.35;
          letter-spacing: -0.01em;
        }

        .admin-badge-pending {
          background: rgba(245, 158, 11, 0.12);
          border: 1px solid rgba(245, 158, 11, 0.25);
          color: #fbbf24;
          padding: 0.3rem 0.75rem;
          font-size: 0.7rem;
          font-weight: 700;
          border-radius: 99px;
          letter-spacing: 0.05em;
          text-transform: uppercase;
          flex-shrink: 0;
        }

        .admin-card-desc {
          font-size: 0.92rem;
          color: var(--admin-text-muted);
          line-height: 1.55;
          margin-bottom: 1.75rem;
          flex-grow: 1;
        }

        .admin-card-mid {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding-top: 1rem;
          border-top: 1px solid rgba(255, 255, 255, 0.06);
          margin-bottom: 1.25rem;
        }

        .admin-reward-box h5 {
          font-size: 0.7rem;
          color: var(--admin-text-muted);
          text-transform: uppercase;
          margin: 0 0 0.25rem;
          letter-spacing: 0.05em;
        }

        .admin-reward-value {
          font-size: 1.15rem;
          font-weight: 800;
          color: #c084fc;
        }

        .admin-date-box h5 {
          font-size: 0.7rem;
          color: var(--admin-text-muted);
          text-transform: uppercase;
          margin: 0 0 0.25rem;
          letter-spacing: 0.05em;
          text-align: right;
        }

        .admin-date-value {
          font-size: 0.88rem;
          font-weight: 600;
          color: #e5e7eb;
          text-align: right;
        }

        .admin-card-actions {
          display: flex;
          gap: 0.85rem;
          width: 100%;
        }

        /* Neon & Glass Buttons */
        .btn-approve-neon {
          flex: 1;
          background: linear-gradient(135deg, #7c3aed, #4f46e5);
          color: #ffffff;
          border: none;
          border-radius: 12px;
          padding: 0.75rem 1.25rem;
          font-size: 0.88rem;
          font-weight: 700;
          cursor: pointer;
          box-shadow: 0 4px 15px rgba(124, 58, 237, 0.25);
          transition: all 0.25s ease;
          text-align: center;
        }

        .btn-approve-neon:hover {
          transform: translateY(-2px);
          box-shadow: 
            0 6px 20px rgba(124, 58, 237, 0.45),
            0 0 10px rgba(99, 102, 241, 0.25);
          opacity: 1;
        }

        .btn-approve-neon:active {
          transform: translateY(0);
        }

        .btn-details-ghost {
          background: rgba(255, 255, 255, 0.04);
          color: #ffffff;
          border: 1px solid rgba(255, 255, 255, 0.12);
          border-radius: 12px;
          padding: 0.75rem 1.1rem;
          font-size: 0.88rem;
          font-weight: 650;
          cursor: pointer;
          transition: all 0.25s ease;
          text-align: center;
        }

        .btn-details-ghost:hover {
          background: rgba(255, 255, 255, 0.08);
          border-color: rgba(255, 255, 255, 0.25);
          transform: translateY(-2px);
        }

        .btn-details-ghost:active {
          transform: translateY(0);
        }

        /* Empty State */
        .admin-empty-state {
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

        .admin-empty-icon {
          font-size: 3.5rem;
          margin-bottom: 1.25rem;
          display: block;
          animation: pulse-icon 2s infinite alternate ease-in-out;
        }

        @keyframes pulse-icon {
          0% { transform: scale(1); opacity: 0.7; }
          100% { transform: scale(1.08); opacity: 1; }
        }

        .admin-empty-title {
          font-size: 1.45rem;
          font-weight: 750;
          color: #ffffff;
          margin: 0 0 0.5rem;
        }

        .admin-empty-desc {
          font-size: 0.95rem;
          color: var(--admin-text-muted);
          margin: 0;
        }

        /* Glassmorphic Modal */
        .admin-modal-overlay {
          position: fixed;
          top: 0; left: 0; right: 0; bottom: 0;
          background: rgba(8, 6, 16, 0.85);
          backdrop-filter: blur(12px);
          -webkit-backdrop-filter: blur(12px);
          display: grid;
          place-items: center;
          z-index: 1000;
          padding: 1.5rem;
          animation: fade-in 0.2s cubic-bezier(0.16, 1, 0.3, 1) both;
        }

        .admin-modal {
          background: rgba(18, 15, 34, 0.98);
          border: 1px solid var(--admin-card-border);
          box-shadow: 
            0 24px 50px rgba(0, 0, 0, 0.5),
            0 0 30px rgba(139, 92, 246, 0.15);
          border-radius: 24px;
          max-width: 540px;
          width: 100%;
          padding: 2.25rem;
          position: relative;
          animation: scale-up 0.3s cubic-bezier(0.34, 1.45, 0.64, 1) both;
        }

        @keyframes fade-in {
          from { opacity: 0; }
          to { opacity: 1; }
        }

        @keyframes scale-up {
          from { transform: scale(0.95); opacity: 0; }
          to { transform: scale(1); opacity: 1; }
        }

        .admin-modal-close {
          position: absolute;
          top: 1.15rem; right: 1.15rem;
          background: rgba(255, 255, 255, 0.04) !important;
          border: none !important;
          width: 32px !important; height: 32px !important;
          border-radius: 50% !important;
          padding: 0 !important;
          color: #ffffff !important;
          display: grid !important;
          place-items: center !important;
          font-size: 0.95rem !important;
          cursor: pointer !important;
          transition: all 0.2s ease !important;
        }

        .admin-modal-close:hover {
          background: rgba(255, 255, 255, 0.12);
          transform: rotate(90deg);
        }

        .admin-modal-title {
          font-size: 1.6rem;
          font-weight: 800;
          color: #ffffff;
          margin: 0 0 1.25rem;
          line-height: 1.3;
        }

        .admin-modal-body {
          font-size: 0.98rem;
          line-height: 1.65;
          color: #d1d5db;
          margin-bottom: 1.75rem;
          max-height: 250px;
          overflow-y: auto;
          padding-right: 0.5rem;
        }

        .admin-modal-body::-webkit-scrollbar {
          width: 6px;
        }
        .admin-modal-body::-webkit-scrollbar-thumb {
          background: rgba(255, 255, 255, 0.1);
          border-radius: 99px;
        }

        .admin-modal-meta-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 1.25rem;
          padding: 1.1rem;
          background: rgba(255, 255, 255, 0.01);
          border: 1px solid rgba(255, 255, 255, 0.04);
          border-radius: 16px;
          margin-bottom: 2rem;
        }

        .admin-modal-meta-item h6 {
          font-size: 0.68rem;
          text-transform: uppercase;
          color: var(--admin-text-muted);
          margin: 0 0 0.3rem;
          letter-spacing: 0.05em;
        }

        .admin-modal-meta-item p {
          font-size: 1rem;
          font-weight: 700;
          color: #ffffff;
          margin: 0;
        }

        .admin-modal-meta-item p.highlight {
          color: #c084fc;
        }

        /* Shimmer Loading */
        .admin-shimmer-card {
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
      `}</style>

      {/* Decorative Blobs */}
      <div className="admin-glow-blob blob-purple"></div>
      <div className="admin-glow-blob blob-indigo"></div>
      <div className="admin-glow-blob blob-pink"></div>

      <div className="admin-container">
        {/* HERO SECTION */}
        <div className="admin-hero">
          <div className="admin-hero-text">
            <h2 className="admin-hero-title">👑 Admin Dashboard</h2>
            <p className="admin-hero-subtitle">Review, manage, and approve pending creator campaigns.</p>
          </div>
          
          <div className="admin-stats-grid">
            <div className="admin-stat-card">
              <h4 className="admin-stat-label">Pending Reviews</h4>
              <span className="admin-stat-value">{loading ? "-" : campaigns.length}</span>
            </div>
            <div className="admin-stat-card">
              <h4 className="admin-stat-label">Approved Campaigns</h4>
              <span className="admin-stat-value">{loading ? "-" : approvedCount}</span>
            </div>
          </div>
        </div>

        {/* CONTENT */}
        {loading ? (
          <div className="admin-campaign-grid">
            <div className="admin-shimmer-card"></div>
            <div className="admin-shimmer-card"></div>
            <div className="admin-shimmer-card"></div>
          </div>
        ) : campaigns.length === 0 ? (
          <div className="admin-empty-state">
            <span className="admin-empty-icon">✨</span>
            <h3 className="admin-empty-title">All Campaigns Reviewed</h3>
            <p className="admin-empty-desc">No campaigns are currently waiting for approval. Check back later!</p>
          </div>
        ) : (
          <div className="admin-campaign-grid">
            {campaigns
              .filter((c) => c && c._id)
              .map((c) => (
                <div key={c._id} className="admin-campaign-card">
                  <div>
                    <div className="admin-card-top">
                      <h3 className="admin-card-title">{c.title || "Untitled Campaign"}</h3>
                      <span className="admin-badge-pending">Pending</span>
                    </div>
                    <p className="admin-card-desc">
                      {shortDescription(c.description)}
                    </p>
                  </div>
                  
                  <div>
                    <div className="admin-card-mid">
                      <div className="admin-reward-box">
                        <h5>Reward</h5>
                        <span className="admin-reward-value">{c.reward || "Not specified"}</span>
                      </div>
                      <div className="admin-date-box">
                        <h5>Deadline</h5>
                        <span className="admin-date-value">{formatDeadline(c.deadline)}</span>
                      </div>
                    </div>

                    <div className="admin-card-actions">
                      <button
                        type="button"
                        className="btn-approve-neon"
                        onClick={() => approveCampaign(c._id)}
                      >
                        Approve Campaign
                      </button>
                      <button
                        type="button"
                        className="btn-details-ghost"
                        onClick={() => setViewCampaign(c)}
                      >
                        Details
                      </button>
                    </div>
                  </div>
                </div>
              ))}
          </div>
        )}
      </div>

      {/* DETAIL MODAL */}
      {viewCampaign && (
        <div
          className="admin-modal-overlay"
          onClick={() => setViewCampaign(null)}
        >
          <div
            className="admin-modal"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              className="admin-modal-close"
              onClick={() => setViewCampaign(null)}
            >
              ✕
            </button>

            <h3 className="admin-modal-title">{viewCampaign.title || "Untitled Campaign"}</h3>
            
            <div className="admin-modal-body">
              {viewCampaign.description || "No description available."}
            </div>

            <div className="admin-modal-meta-grid">
              <div className="admin-modal-meta-item">
                <h6>Reward</h6>
                <p className="highlight">{viewCampaign.reward || "Not specified"}</p>
              </div>
              <div className="admin-modal-meta-item">
                <h6>Deadline</h6>
                <p>{formatDeadline(viewCampaign.deadline)}</p>
              </div>
            </div>

            <button
              type="button"
              className="btn-approve-neon"
              style={{ width: "100%" }}
              onClick={() => approveCampaign(viewCampaign._id)}
            >
              Approve Campaign
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminDashboard;
