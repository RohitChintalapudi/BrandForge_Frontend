import { useEffect, useState } from "react";
import api from "../api/axios";
import { toast } from "react-toastify";
import { useAuth } from "../context/AuthContext";

const AdminDashboard = () => {
  const { user } = useAuth();

  const [pendingCampaigns, setPendingCampaigns] = useState([]);
  const [allCampaigns, setAllCampaigns] = useState([]);
  const [activeTab, setActiveTab] = useState("pending"); // "pending" | "all"
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState("newest"); // "newest" | "reward" | "deadline"
  const [approvingId, setApprovingId] = useState(null);
  const [selectedCampaign, setSelectedCampaign] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const [pendingRes, allRes] = await Promise.allSettled([
        api.get("/api/campaigns/pending"),
        api.get("/api/campaigns"),
      ]);

      if (pendingRes.status === "fulfilled") {
        setPendingCampaigns(pendingRes.value.data || []);
      }
      if (allRes.status === "fulfilled") {
        setAllCampaigns(allRes.value.data || []);
      }
    } catch {
      toast.error("Failed to load dashboard data");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const approveCampaign = async (id, title) => {
    if (approvingId) return;
    setApprovingId(id);

    try {
      await api.put(`/api/campaigns/${id}/approve`);
      toast.success(`🎉 Campaign "${title || 'Campaign'}" approved & published live!`);

      // Update local state
      setPendingCampaigns((prev) => prev.filter((c) => c._id !== id));
      setAllCampaigns((prev) =>
        prev.map((c) => (c._id === id ? { ...c, status: "approved" } : c))
      );

      if (selectedCampaign && selectedCampaign._id === id) {
        setSelectedCampaign((prev) => (prev ? { ...prev, status: "approved" } : null));
      }
    } catch (err) {
      toast.error(err.response?.data?.message || "Approval failed");
    } finally {
      setApprovingId(null);
    }
  };

  // Metrics
  const pendingCount = pendingCampaigns.length;
  const approvedCount = allCampaigns.filter((c) => c.status === "approved").length;
  const totalCampaignsCount = allCampaigns.length;

  // Calculate pending reward pool sum
  const pendingRewardSum = pendingCampaigns.reduce((acc, curr) => {
    const val = parseInt(String(curr.reward).replace(/[^0-9]/g, ""), 10);
    return acc + (isNaN(val) ? 0 : val);
  }, 0);

  // Active dataset based on tab
  const currentDataset = activeTab === "pending" ? pendingCampaigns : allCampaigns;

  // Filtered and sorted dataset
  const displayedCampaigns = currentDataset
    .filter((c) => {
      if (!c || !c._id) return false;
      const q = searchQuery.toLowerCase();
      const matchesTitle = c.title?.toLowerCase().includes(q);
      const matchesDesc = c.description?.toLowerCase().includes(q);
      const matchesReward = String(c.reward)?.toLowerCase().includes(q);
      return matchesTitle || matchesDesc || matchesReward;
    })
    .sort((a, b) => {
      if (sortBy === "reward") {
        const rA = parseInt(String(a.reward).replace(/[^0-9]/g, ""), 10) || 0;
        const rB = parseInt(String(b.reward).replace(/[^0-9]/g, ""), 10) || 0;
        return rB - rA;
      }
      if (sortBy === "deadline") {
        return new Date(a.deadline || 0) - new Date(b.deadline || 0);
      }
      // default "newest"
      return new Date(b.createdAt || 0) - new Date(a.createdAt || 0);
    });

  return (
    <div className="admin-dashboard-layout">
      {/* Background ambient lighting */}
      <div className="ambient-glow glow-top-left"></div>
      <div className="ambient-glow glow-bottom-right"></div>
      <div className="ambient-mesh-pattern"></div>

      <div className="dashboard-main-container">
        {/* Master Control Header */}
        <div className="admin-welcome-banner">
          <div className="welcome-text-group">
            <div className="admin-role-chip">
              <span>👑 Platform Operations Control</span>
            </div>
            <h1>Admin Oversight & Moderation ⚡</h1>
            <p>
              Review pending campaign submissions from brand partners, verify
              creator guidelines, and grant live platform publication.
            </p>
          </div>

          <div className="welcome-actions">
            <button
              type="button"
              className="admin-refresh-btn"
              onClick={fetchData}
              disabled={isLoading}
            >
              <svg
                className={isLoading ? "refresh-spinning" : ""}
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8" />
                <path d="M21 3v5h-5" />
                <path d="M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16" />
                <path d="M8 16H3v5" />
              </svg>
              <span>{isLoading ? "Refreshing..." : "Refresh Queue"}</span>
            </button>
          </div>
        </div>

        {/* 4-Metric Executive Summary Bar */}
        <div className="metrics-dashboard-grid">
          {/* Pending Reviews */}
          <div className="metric-stat-card stat-pending">
            <div className="metric-stat-header">
              <span className="metric-stat-label">Pending Approval</span>
              <span className="metric-stat-badge badge-amber">Needs Action</span>
            </div>
            <div className="metric-stat-value">{pendingCount}</div>
            <div className="metric-stat-footer">
              <span>Awaiting admin verification</span>
            </div>
          </div>

          {/* Approved & Live */}
          <div className="metric-stat-card stat-approved">
            <div className="metric-stat-header">
              <span className="metric-stat-label">Verified & Live</span>
              <span className="metric-stat-badge badge-green">Active</span>
            </div>
            <div className="metric-stat-value">{approvedCount}</div>
            <div className="metric-stat-footer">
              <span>Open for creator submissions</span>
            </div>
          </div>

          {/* Total Pending Rewards */}
          <div className="metric-stat-card">
            <div className="metric-stat-header">
              <span className="metric-stat-label">Pending Reward Pool</span>
              <span className="metric-stat-badge">Escrow Pool</span>
            </div>
            <div className="metric-stat-value">
              ₹{pendingRewardSum.toLocaleString()}
            </div>
            <div className="metric-stat-footer">
              <span>Total budget in review</span>
            </div>
          </div>

          {/* System Status */}
          <div className="metric-stat-card stat-action">
            <div className="metric-stat-header">
              <span className="metric-stat-label">System Health</span>
              <span className="metric-stat-badge badge-green">Operational</span>
            </div>
            <div className="metric-stat-value" style={{ fontSize: "1.5rem" }}>
              Ready & Live
            </div>
            <div className="metric-stat-footer">
              <span className="live-status-dot"></span>
              <span>All backend services online</span>
            </div>
          </div>
        </div>

        {/* Campaign Moderation Explorer & Filter Bar */}
        <div className="campaigns-explorer-header">
          <div className="explorer-title-group">
            <h2>Campaign Queue</h2>
            <span className="count-pill">{displayedCampaigns.length} items</span>
          </div>

          <div className="explorer-controls">
            {/* Search Input */}
            <div className="search-input-box">
              <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <circle cx="11" cy="11" r="8" />
                <line x1="21" y1="21" x2="16.65" y2="16.65" />
              </svg>
              <input
                type="text"
                placeholder="Search by title, reward..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>

            {/* Sort Selector */}
            <select
              className="admin-sort-select"
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
            >
              <option value="newest">Sort: Newest First</option>
              <option value="reward">Sort: Highest Reward</option>
              <option value="deadline">Sort: Urgent Deadline</option>
            </select>

            {/* View Mode Pills */}
            <div className="filter-pill-group">
              <button
                type="button"
                className={`filter-pill ${activeTab === "pending" ? "active" : ""}`}
                onClick={() => setActiveTab("pending")}
              >
                Pending Queue ({pendingCount})
              </button>
              <button
                type="button"
                className={`filter-pill ${activeTab === "all" ? "active" : ""}`}
                onClick={() => setActiveTab("all")}
              >
                All Campaigns ({totalCampaignsCount})
              </button>
            </div>
          </div>
        </div>

        {/* Campaign Moderation Grid */}
        {displayedCampaigns.length === 0 ? (
          <div className="empty-campaigns-box">
            <div className="empty-icon">
              {activeTab === "pending" ? "✨" : "📂"}
            </div>
            <h3>
              {activeTab === "pending"
                ? "Queue is completely clear!"
                : "No campaigns found"}
            </h3>
            <p>
              {activeTab === "pending"
                ? "All submitted brand campaigns have been moderated and published live."
                : "Try adjusting your search criteria or switch to the pending queue."}
            </p>
          </div>
        ) : (
          <div className="admin-campaigns-grid">
            {displayedCampaigns.map((c) => {
              const isPending = c.status === "pending";
              const isApproving = approvingId === c._id;

              return (
                <div
                  className={`admin-campaign-card ${isPending ? "card-pending-glow" : ""}`}
                  key={c._id}
                >
                  <div className="card-top-row">
                    <span
                      className={`status-chip ${
                        isPending ? "chip-pending" : "chip-approved"
                      }`}
                    >
                      <span className="status-dot"></span>
                      {isPending ? "Awaiting Review" : "Approved & Live"}
                    </span>

                    {c.deadline && (
                      <div className="deadline-tag">
                        <svg
                          width="14"
                          height="14"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        >
                          <rect width="18" height="18" x="3" y="4" rx="2" ry="2" />
                          <line x1="16" x2="16" y1="2" y2="6" />
                          <line x1="8" x2="8" y1="2" y2="6" />
                          <line x1="3" x2="21" y1="10" y2="10" />
                        </svg>
                        <span>
                          Due: {new Date(c.deadline).toLocaleDateString()}
                        </span>
                      </div>
                    )}
                  </div>

                  <h3 className="campaign-card-title">{c.title || "Untitled Campaign"}</h3>
                  <p className="campaign-card-desc">
                    {c.description || "No description provided."}
                  </p>

                  <div className="admin-card-details">
                    <div className="reward-badge-group">
                      <span className="reward-label">Offered Reward</span>
                      <span className="reward-amount">
                        {c.reward ? `₹${c.reward}` : "₹0"}
                      </span>
                    </div>

                    {c.brand && (
                      <div className="brand-id-chip" title={c.brand}>
                        <span>Brand Partner</span>
                      </div>
                    )}
                  </div>

                  <div className="admin-card-actions">
                    <button
                      type="button"
                      className="admin-inspect-btn"
                      onClick={() => setSelectedCampaign(c)}
                    >
                      <span>Inspect Details</span>
                      <svg
                        width="14"
                        height="14"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      >
                        <path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z" />
                        <circle cx="12" cy="12" r="3" />
                      </svg>
                    </button>

                    {isPending ? (
                      <button
                        type="button"
                        className="admin-approve-btn"
                        onClick={() => approveCampaign(c._id, c.title)}
                        disabled={isApproving}
                      >
                        {isApproving ? (
                          <div className="btn-spinner-row">
                            <span className="btn-spinner"></span>
                            <span>Approving...</span>
                          </div>
                        ) : (
                          <>
                            <span>Approve & Publish</span>
                            <span className="approve-rocket">🚀</span>
                          </>
                        )}
                      </button>
                    ) : (
                      <div className="approved-confirmed-badge">
                        <span>✓ Live on Platform</span>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Campaign Details Inspector Modal */}
      {selectedCampaign && (
        <div
          className="create-modal-backdrop"
          onClick={() => setSelectedCampaign(null)}
        >
          <div
            className="create-modal-card admin-inspector-card"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="modal-top-bar">
              <div className="modal-title-group">
                <span className="modal-badge">
                  {selectedCampaign.status === "pending"
                    ? "Pending Verification"
                    : "Verified Campaign"}
                </span>
                <h2>{selectedCampaign.title}</h2>
              </div>
              <button
                type="button"
                className="modal-close-button"
                onClick={() => setSelectedCampaign(null)}
              >
                ✕
              </button>
            </div>

            <div className="inspector-content">
              <div className="inspector-stats-row">
                <div className="inspector-stat-box">
                  <span className="inspector-label">Reward Pool</span>
                  <strong className="inspector-value text-purple">
                    {selectedCampaign.reward ? `₹${selectedCampaign.reward}` : "₹0"}
                  </strong>
                </div>

                <div className="inspector-stat-box">
                  <span className="inspector-label">Deadline</span>
                  <strong className="inspector-value">
                    {selectedCampaign.deadline
                      ? new Date(selectedCampaign.deadline).toLocaleDateString()
                      : "Open"}
                  </strong>
                </div>

                <div className="inspector-stat-box">
                  <span className="inspector-label">Moderation Status</span>
                  <strong
                    className={`inspector-value ${
                      selectedCampaign.status === "approved"
                        ? "text-green"
                        : "text-amber"
                    }`}
                  >
                    {selectedCampaign.status === "approved"
                      ? "Approved & Live"
                      : "Pending Review"}
                  </strong>
                </div>
              </div>

              <div className="inspector-section">
                <label className="inspector-section-label">
                  Campaign Description & Creator Guidelines
                </label>
                <div className="inspector-description-box">
                  {selectedCampaign.description || "No description provided."}
                </div>
              </div>

              <div className="inspector-meta-bar">
                <span>Campaign ID: {selectedCampaign._id}</span>
                {selectedCampaign.createdAt && (
                  <span>
                    Submitted: {new Date(selectedCampaign.createdAt).toLocaleString()}
                  </span>
                )}
              </div>
            </div>

            <div className="modal-action-bar">
              <button
                type="button"
                className="modal-cancel-btn"
                onClick={() => setSelectedCampaign(null)}
              >
                Close Inspector
              </button>

              {selectedCampaign.status === "pending" && (
                <button
                  type="button"
                  className="modal-submit-btn"
                  onClick={() => {
                    approveCampaign(selectedCampaign._id, selectedCampaign.title);
                  }}
                  disabled={approvingId === selectedCampaign._id}
                >
                  {approvingId === selectedCampaign._id ? (
                    <div className="btn-spinner-row">
                      <span className="btn-spinner"></span>
                      <span>Publishing...</span>
                    </div>
                  ) : (
                    <span>Approve & Publish Campaign 🚀</span>
                  )}
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminDashboard;
