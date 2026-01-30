import { useState } from "react";
import { inviteUser } from "../../api/adminUserApi";
import AdminSidebar from "../../components/admin/AdminSidebar";
import CreateExamWizard from "../../components/admin/CreateExamWizard";
import InviteAdmin from "../../components/admin/InviteAdmin";
import "../../styles/AdminDashboard.css";

function AdminDashboard() {
  const [activeTab, setActiveTab] = useState("overview");
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteName, setInviteName] = useState("");
  const [inviteMessage, setInviteMessage] = useState("");

  const handleInviteSubmit = async (e) => {
    e.preventDefault();
  
    try {
      await inviteUser({
        email: inviteEmail,
        name: inviteName,
        role: "ADMIN",
        inviteExpiryHours: 1,
      });
  
      setInviteMessage("Invitation sent successfully");
      setInviteEmail("");
      setInviteName("");
      setInviteRole("STUDENT");
    } catch (error) {
      console.error(error);
      setInviteMessage("Failed to send invitation");
    }
  };
  


  return (
    <div className="admin-dashboard">
      <AdminSidebar setActiveTab={setActiveTab} />

      <div className="admin-content">
        {activeTab === "overview" && (
          <>
            <h1>Dashboard Overview</h1>
            <p>Welcome to the Admin Dashboard.</p>
          </>
        )}

        {activeTab === "exams" && (
          <>
            <h1>Create New Exam</h1>
            <CreateExamWizard />
          </>
        )}

        {activeTab === "inviteAdmin" && (
          <>
            <h1>Invite Admin</h1>
            <InviteAdmin />
          </>
        )}
      </div>
    </div>
  );
}

export default AdminDashboard;