import { useEffect, useState } from "react";
import api from "../api/axios";
import { toast } from "react-toastify";

const AdminDashboard = () => {
  const [campaigns, setCampaigns] = useState([]);
  const [viewCampaign, setViewCampaign] = useState(null);

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

  const shortDescription = (text, maxChars = 90) => {
    const s = (text ?? "").toString().trim();
    if (!s) return "No description available";
    if (s.length <= maxChars) return s;
    const cut = s.slice(0, maxChars);
    const lastSpace = cut.lastIndexOf(" ");
    return `${cut.slice(0, lastSpace > 40 ? lastSpace : maxChars).trim()}...`;
  };

  const fetchPending = async () => {
    try {
      const res = await api.get("/api/campaigns/pending");
      setCampaigns(res.data);
    } catch {
      toast.error("Failed to load pending campaigns");
    }
  };

  useEffect(() => {
    fetchPending();
  }, []);

  const approveCampaign = async (id) => {
    try {
      await api.put(`/api/campaigns/${id}/approve`);
      toast.success("Campaign approved");
      setCampaigns((prev) => prev.filter((c) => c._id !== id));
      setViewCampaign((v) => (v && v._id === id ? null : v));
    } catch {
      toast.error("Approval failed");
    }
  };

  const rejectCampaign = async (id) => {
    try {
      await api.put(`/api/campaigns/${id}/reject`);
      toast.success("Campaign rejected");
      setCampaigns((prev) => prev.filter((c) => c._id !== id));
      setViewCampaign((v) => (v && v._id === id ? null : v));
    } catch {
      toast.error("Rejection failed");
    }
  };

  return (
    <div className="dashboard-wrapper">
      <div className="dashboard-background">
        <div className="dashboard-blob blob-1"></div>
        <div className="dashboard-blob blob-2"></div>
        <div className="dashboard-blob blob-3"></div>
      </div>
      <div className="dashboard">
        <div className="dashboard-header">
          <h2>👑 Admin Dashboard</h2>
          <p className="dashboard-subtitle">Manage and approve campaigns</p>
        </div>

        {campaigns.length === 0 && (
          <div className="empty-state">
            <p>No pending campaigns</p>
          </div>
        )}

        <div className="grid">
          {campaigns
            .filter((c) => c && c._id)
            .map((c) => (
              <div key={c._id} className="card premium-card">
                <div className="card-header">
                  <h3>{c.title || "Untitled Campaign"}</h3>
                  <span className="badge pending">Pending</span>
                </div>
                <p className="card-description">
                  {shortDescription(c.description)}
                </p>
                <div className="card-footer">
                  <p className="reward-text">
                    <strong>Reward:</strong> {c.reward || "Not specified"}
                  </p>
                  <div className="admin-card-actions">
                    <button
                      type="button"
                      className="action-btn premium-btn"
                      onClick={() => approveCampaign(c._id)}
                    >
                      Approve Campaign
                    </button>
                    <button
                      type="button"
                      className="admin-btn-reject"
                      onClick={() => rejectCampaign(c._id)}
                    >
                      Reject Campaign
                    </button>
                    <button
                      type="button"
                      className="action-btn"
                      style={{
                        background: "transparent",
                        color: "var(--purple-2)",
                        paddingInline: "0",
                      }}
                      onClick={() => setViewCampaign(c)}
                    >
                      View details
                    </button>
                  </div>
                </div>
              </div>
            ))}
        </div>
      </div>

      {viewCampaign && (
        <div
          className="modal-overlay"
          onClick={() => setViewCampaign(null)}
        >
          <div
            className="modal"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              className="modal-close-btn"
              onClick={() => setViewCampaign(null)}
            >
              ✕
            </button>

            <h3>{viewCampaign.title || "Untitled Campaign"}</h3>
            <p style={{ marginTop: "0.8rem" }}>
              {viewCampaign.description || "No description available"}
            </p>
            <p style={{ marginTop: "1rem", fontWeight: 600 }}>
              Reward:{" "}
              <span style={{ fontWeight: 700 }}>
                {viewCampaign.reward || "Not specified"}
              </span>
            </p>
            <p style={{ marginTop: "0.6rem", fontSize: "0.9rem" }}>
              Deadline:{" "}
              <span style={{ fontWeight: 500 }}>
                {formatDeadline(viewCampaign.deadline)}
              </span>
            </p>
            <div
              style={{
                marginTop: "1.25rem",
                display: "flex",
                gap: "0.6rem",
                flexWrap: "wrap",
              }}
            >
              <button
                type="button"
                className="action-btn premium-btn"
                onClick={() => approveCampaign(viewCampaign._id)}
              >
                Approve
              </button>
              <button
                type="button"
                className="admin-btn-reject"
                onClick={() => rejectCampaign(viewCampaign._id)}
              >
                Reject
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminDashboard;
