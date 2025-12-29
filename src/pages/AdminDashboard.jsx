import { useEffect, useState } from "react";
import api from "../api/axios";
import { toast } from "react-toastify";

const AdminDashboard = () => {
  const [campaigns, setCampaigns] = useState([]);

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
    } catch {
      toast.error("Approval failed");
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
          {campaigns.filter(c => c && c._id).map((c) => (
            <div key={c._id} className="card premium-card">
              <div className="card-header">
                <h3>{c.title || "Untitled Campaign"}</h3>
                <span className="badge pending">Pending</span>
              </div>
              <p className="card-description">{c.description || "No description available"}</p>
              <div className="card-footer">
                <p className="reward-text">
                  <strong>Reward:</strong> {c.reward || "Not specified"}
                </p>
                <button
                  className="action-btn premium-btn"
                  onClick={() => approveCampaign(c._id)}
                >
                  Approve Campaign
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
