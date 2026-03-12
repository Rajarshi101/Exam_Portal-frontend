// // src/components/admin/BatchManagement.jsx
// import { useState, useEffect } from "react";
// import axios from "axios";
// import "../../styles/BatchManagement.css";

// function BatchManagement() {
//   const [batches, setBatches] = useState([]);
//   const [loading, setLoading] = useState(true);
//   const [error, setError] = useState(null);
//   const [showCreateModal, setShowCreateModal] = useState(false);
//   const [selectedBatch, setSelectedBatch] = useState(null);
//   const [students, setStudents] = useState([]);
//   const [showStudentsModal, setShowStudentsModal] = useState(false);
//   const [studentsLoading, setStudentsLoading] = useState(false);
  
//   // Form state
//   const [formData, setFormData] = useState({
//     name: "",
//     description: ""
//   });
//   const [formError, setFormError] = useState("");
//   const [formSuccess, setFormSuccess] = useState("");

//   // Fetch all batches
//   const fetchBatches = async () => {
//     try {
//       setLoading(true);
//       const token = localStorage.getItem("token");
//       const response = await axios.get("http://localhost:8080/admin/users/batches", {
//         headers: { Authorization: `Bearer ${token}` }
//       });
//       setBatches(response.data);
//       setError(null);
//     } catch (err) {
//       setError("Failed to load batches");
//       console.error("Error fetching batches:", err);
//     } finally {
//       setLoading(false);
//     }
//   };

//   useEffect(() => {
//     fetchBatches();
//   }, []);

//   // Fetch students for a specific batch
//   const fetchStudents = async (batchId) => {
//     try {
//       setStudentsLoading(true);
//       const token = localStorage.getItem("token");
//       const response = await axios.get(`http://localhost:8080/admin/users/${batchId}/students`, {
//         headers: { Authorization: `Bearer ${token}` }
//       });
//       setStudents(response.data);
//       setShowStudentsModal(true);
//     } catch (err) {
//       alert("Failed to load students");
//       console.error("Error fetching students:", err);
//     } finally {
//       setStudentsLoading(false);
//     }
//   };

//   // Handle form input change
//   const handleInputChange = (e) => {
//     const { name, value } = e.target;
//     setFormData(prev => ({
//       ...prev,
//       [name]: value
//     }));
//     // Clear errors when user starts typing
//     setFormError("");
//   };

//   // Handle create batch
//   const handleCreateBatch = async (e) => {
//     e.preventDefault();
    
//     // Validate form
//     if (!formData.name.trim()) {
//       setFormError("Batch name is required");
//       return;
//     }

//     try {
//       const token = localStorage.getItem("token");
//       const response = await axios.post(
//         "http://localhost:8080/admin/users/create/batch",
//         formData,
//         { headers: { Authorization: `Bearer ${token}` } }
//       );

//       // Success
//       setFormSuccess("Batch created successfully!");
//       setFormData({ name: "", description: "" });
//       fetchBatches(); // Refresh the list
      
//       // Clear success message after 3 seconds
//       setTimeout(() => setFormSuccess(""), 3000);
      
//       // Close modal after 1 second
//       setTimeout(() => {
//         setShowCreateModal(false);
//         setFormSuccess("");
//       }, 1000);
      
//     } catch (err) {
//       if (err.response && err.response.data && err.response.data.error) {
//         setFormError(err.response.data.error);
//       } else {
//         setFormError("Failed to create batch. Please try again.");
//       }
//       console.error("Error creating batch:", err);
//     }
//   };

//   // Handle view students
//   const handleViewStudents = (batch) => {
//     setSelectedBatch(batch);
//     fetchStudents(batch.id);
//   };

//   return (
//     <div className="batch-management">
//       <div className="batch-header">
//         <h1>Batch Management</h1>
//         <button 
//           className="btn-create-batch"
//           onClick={() => setShowCreateModal(true)}
//         >
//           + Create New Batch
//         </button>
//       </div>

//       {error && <div className="error-message">{error}</div>}

//       {loading ? (
//         <div className="loading-spinner">Loading batches...</div>
//       ) : (
//         <div className="batch-table-container">
//   <table className="batch-table">
//     <thead>
//       <tr>
//         <th>#</th>
//         <th>Batch Name</th>
//         <th>Description</th>
//         <th>Action</th>
//       </tr>
//     </thead>

//     <tbody>
//       {batches.map((batch, index) => (
//         <tr key={batch.id}>
//           <td>{index + 1}</td>
//           <td>{batch.name}</td>
//           <td>{batch.description}</td>
//           <td>
//             <button
//               className="btn-view-students"
//               onClick={() => handleViewStudents(batch)}
//             >
//               View Students
//             </button>
//           </td>
//         </tr>
//       ))}

//       {batches.length === 0 && (
//         <tr>
//           <td colSpan="4" className="no-batches">
//             No batches found. Click "Create New Batch" to add one.
//           </td>
//         </tr>
//       )}
//     </tbody>
//   </table>
// </div>
//       )}

//       {/* Create Batch Modal */}
//       {showCreateModal && (
//         <div className="modal-overlay">
//           <div className="modal-content">
//             <div className="modal-header">
//               <h2>Create New Batch</h2>
//               <button 
//                 className="modal-close"
//                 onClick={() => {
//                   setShowCreateModal(false);
//                   setFormError("");
//                   setFormSuccess("");
//                   setFormData({ name: "", description: "" });
//                 }}
//               >
//                 ×
//               </button>
//             </div>

//             <form onSubmit={handleCreateBatch}>
//               <div className="form-group">
//                 <label htmlFor="name">Batch Name *</label>
//                 <input
//                   type="text"
//                   id="name"
//                   name="name"
//                   value={formData.name}
//                   onChange={handleInputChange}
//                   placeholder="Enter batch name"
//                   className={formError ? "error" : ""}
//                 />
//               </div>

//               <div className="form-group">
//                 <label htmlFor="description">Description</label>
//                 <textarea
//                   id="description"
//                   name="description"
//                   value={formData.description}
//                   onChange={handleInputChange}
//                   placeholder="Enter batch description"
//                   rows="3"
//                 />
//               </div>

//               {formError && (
//                 <div className="form-error">{formError}</div>
//               )}

//               {formSuccess && (
//                 <div className="form-success">{formSuccess}</div>
//               )}

//               <div className="modal-actions">
//                 <button 
//                   type="button" 
//                   className="btn-cancel"
//                   onClick={() => {
//                     setShowCreateModal(false);
//                     setFormError("");
//                     setFormSuccess("");
//                     setFormData({ name: "", description: "" });
//                   }}
//                 >
//                   Cancel
//                 </button>
//                 <button type="submit" className="btn-submit">
//                   Create Batch
//                 </button>
//               </div>
//             </form>
//           </div>
//         </div>
//       )}

//       {/* Students Modal */}
//       {showStudentsModal && (
//         <div className="modal-overlay">
//           <div className="modal-content students-modal">
//             <div className="modal-header">
//               <h2>Students in {selectedBatch?.name}</h2>
//               <button 
//                 className="modal-close"
//                 onClick={() => {
//                   setShowStudentsModal(false);
//                   setSelectedBatch(null);
//                   setStudents([]);
//                 }}
//               >
//                 ×
//               </button>
//             </div>

//             {studentsLoading ? (
//               <div className="loading-spinner">Loading students...</div>
//             ) : (
//               <div className="students-list">
//                 {students.length > 0 ? (
//                   <table className="students-table">
//                     <thead>
//                       <tr>
//                         <th>Name</th>
//                         <th>Email</th>
//                       </tr>
//                     </thead>
//                     <tbody>
//                       {students.map((student, index) => (
//                         <tr key={index}>
//                           <td>{student.name}</td>
//                           <td>{student.email}</td>
//                         </tr>
//                       ))}
//                     </tbody>
//                   </table>
//                 ) : (
//                   <p className="no-students">No students found in this batch</p>
//                 )}
//               </div>
//             )}

//             <div className="modal-actions">
//               <button 
//                 className="btn-cancel"
//                 onClick={() => {
//                   setShowStudentsModal(false);
//                   setSelectedBatch(null);
//                   setStudents([]);
//                 }}
//               >
//                 Close
//               </button>
//             </div>
//           </div>
//         </div>
//       )}
//     </div>
//   );
// }

// export default BatchManagement;



// // src/components/admin/BatchManagement.jsx
// import { useState, useEffect } from "react";
// import axios from "axios";
// import Papa from "papaparse";
// import "../../styles/BatchManagement.css";

// function BatchManagement() {
//   const [batches, setBatches] = useState([]);
//   const [loading, setLoading] = useState(true);
//   const [error, setError] = useState(null);
//   const [showCreateModal, setShowCreateModal] = useState(false);
//   const [selectedBatch, setSelectedBatch] = useState(null);
//   const [students, setStudents] = useState([]);
//   const [showStudentsModal, setShowStudentsModal] = useState(false);
//   const [studentsLoading, setStudentsLoading] = useState(false);
  
//   // Add Students Modal states
//   const [showAddStudentsModal, setShowAddStudentsModal] = useState(false);
//   const [addMethod, setAddMethod] = useState(null); // 'manual' or 'csv'
//   const [manualEntries, setManualEntries] = useState([{ name: "", email: "" }]);
//   const [csvData, setCsvData] = useState([]);
//   const [csvFileName, setCsvFileName] = useState("");
//   const [processingUsers, setProcessingUsers] = useState(false);
//   const [checkUsersResult, setCheckUsersResult] = useState(null);
//   const [inviteExpiryHours, setInviteExpiryHours] = useState(24);
//   const [showInviteSection, setShowInviteSection] = useState(false);
  
//   // Form state for create batch
//   const [formData, setFormData] = useState({
//     name: "",
//     description: ""
//   });
//   const [formError, setFormError] = useState("");
//   const [formSuccess, setFormSuccess] = useState("");

//   // Fetch all batches
//   const fetchBatches = async () => {
//     try {
//       setLoading(true);
//       const token = localStorage.getItem("token");
//       const response = await axios.get("http://localhost:8080/admin/users/batches", {
//         headers: { Authorization: `Bearer ${token}` }
//       });
//       setBatches(response.data);
//       setError(null);
//     } catch (err) {
//       setError("Failed to load batches");
//       console.error("Error fetching batches:", err);
//     } finally {
//       setLoading(false);
//     }
//   };

//   useEffect(() => {
//     fetchBatches();
//   }, []);

//   // Fetch students for a specific batch
//   const fetchStudents = async (batchId) => {
//     try {
//       setStudentsLoading(true);
//       const token = localStorage.getItem("token");
//       const response = await axios.get(`http://localhost:8080/admin/users/${batchId}/students`, {
//         headers: { Authorization: `Bearer ${token}` }
//       });
//       setStudents(response.data);
//       setShowStudentsModal(true);
//     } catch (err) {
//       alert("Failed to load students");
//       console.error("Error fetching students:", err);
//     } finally {
//       setStudentsLoading(false);
//     }
//   };

//   // Handle form input change for create batch
//   const handleInputChange = (e) => {
//     const { name, value } = e.target;
//     setFormData(prev => ({
//       ...prev,
//       [name]: value
//     }));
//     setFormError("");
//   };

//   // Handle create batch
//   const handleCreateBatch = async (e) => {
//     e.preventDefault();
    
//     if (!formData.name.trim()) {
//       setFormError("Batch name is required");
//       return;
//     }

//     try {
//       const token = localStorage.getItem("token");
//       const response = await axios.post(
//         "http://localhost:8080/admin/users/create/batch",
//         formData,
//         { headers: { Authorization: `Bearer ${token}` } }
//       );

//       setFormSuccess("Batch created successfully!");
//       setFormData({ name: "", description: "" });
//       fetchBatches();
      
//       setTimeout(() => setFormSuccess(""), 3000);
//       setTimeout(() => {
//         setShowCreateModal(false);
//         setFormSuccess("");
//       }, 1000);
      
//     } catch (err) {
//       if (err.response && err.response.data && err.response.data.error) {
//         setFormError(err.response.data.error);
//       } else {
//         setFormError("Failed to create batch. Please try again.");
//       }
//       console.error("Error creating batch:", err);
//     }
//   };

//   // Handle view students
//   const handleViewStudents = (batch) => {
//     setSelectedBatch(batch);
//     fetchStudents(batch.id);
//   };

//   // Handle add students
//   const handleAddStudents = (batch) => {
//     setSelectedBatch(batch);
//     setAddMethod(null);
//     setManualEntries([{ name: "", email: "" }]);
//     setCsvData([]);
//     setCsvFileName("");
//     setCheckUsersResult(null);
//     setShowInviteSection(false);
//     setInviteExpiryHours(24);
//     setShowAddStudentsModal(true);
//   };

//   // Manual entry handlers
//   const handleManualEntryChange = (index, field, value) => {
//     const updated = [...manualEntries];
//     updated[index][field] = value;
//     setManualEntries(updated);
//   };

//   const addManualEntry = () => {
//     setManualEntries([...manualEntries, { name: "", email: "" }]);
//   };

//   const removeManualEntry = (index) => {
//     if (manualEntries.length > 1) {
//       setManualEntries(manualEntries.filter((_, i) => i !== index));
//     }
//   };

//   // CSV upload handler
//   const handleCSVUpload = (event) => {
//     const file = event.target.files[0];
//     if (!file) return;

//     setCsvFileName(file.name);
    
//     Papa.parse(file, {
//       header: true,
//       skipEmptyLines: true,
//       complete: (results) => {
//         // Validate CSV structure
//         const validData = results.data.filter(row => 
//           row.name && row.name.trim() !== "" && 
//           row.email && row.email.trim() !== ""
//         ).map(row => ({
//           name: row.name.trim(),
//           email: row.email.trim()
//         }));

//         if (validData.length === 0) {
//           alert("No valid data found in CSV. Please ensure columns are named 'name' and 'email'");
//           return;
//         }

//         setCsvData(validData);
//       },
//       error: (error) => {
//         alert("Error parsing CSV file: " + error.message);
//       }
//     });
//   };

//   // Get users array based on selected method
//   const getUsersArray = () => {
//     if (addMethod === 'manual') {
//       return manualEntries.filter(entry => entry.name.trim() !== "" && entry.email.trim() !== "");
//     } else if (addMethod === 'csv') {
//       return csvData;
//     }
//     return [];
//   };

//   // Check users before adding
//   const handleCheckUsers = async () => {
//     const users = getUsersArray();
    
//     if (users.length === 0) {
//       alert("Please add at least one user");
//       return;
//     }

//     try {
//       setProcessingUsers(true);
//       const token = localStorage.getItem("token");
//       const response = await axios.post(
//         "http://localhost:8080/admin/users/check-users",
//         users,
//         { headers: { Authorization: `Bearer ${token}` } }
//       );

//       setCheckUsersResult(response.data);

//       if (response.data.allExists) {
//         // All users exist, proceed directly to add them
//         await handleAddUsersToBatch(users);
//       } else {
//         // Some users are new, show invite section
//         setShowInviteSection(true);
//       }
//     } catch (err) {
//       alert("Error checking users: " + (err.response?.data?.error || err.message));
//     } finally {
//       setProcessingUsers(false);
//     }
//   };

//   // Add users to batch
//   const handleAddUsersToBatch = async (users) => {
//     try {
//       const token = localStorage.getItem("token");
      
//       // Prepare request body
//       let requestBody = {
//         users: users
//       };

//       // If there are new users and we have invite expiry, add it
//       if (checkUsersResult && !checkUsersResult.allExists && inviteExpiryHours) {
//         requestBody = {
//           inviteExpiryHours: parseInt(inviteExpiryHours),
//           role: "CANDIDATE",
//           users: users
//         };
//       }

//       const response = await axios.post(
//         `http://localhost:8080/admin/users/candidate/${selectedBatch.id}/multiple`,
//         requestBody,
//         { headers: { Authorization: `Bearer ${token}` } }
//       );

//       alert("Users added successfully!");
      
//       // Reset and close modal
//       setShowAddStudentsModal(false);
//       setAddMethod(null);
//       setManualEntries([{ name: "", email: "" }]);
//       setCsvData([]);
//       setCheckUsersResult(null);
//       setShowInviteSection(false);
      
//       // Refresh students list if modal is open
//       if (showStudentsModal) {
//         fetchStudents(selectedBatch.id);
//       }
      
//     } catch (err) {
//       alert("Error adding users: " + (err.response?.data?.error || err.message));
//     }
//   };

//   // Proceed with adding users (after invite section if needed)
//   const handleProceedAddUsers = async () => {
//     const users = getUsersArray();
    
//     if (checkUsersResult && !checkUsersResult.allExists) {
//       // Show alert with new users info
//       const newUsersList = checkUsersResult.newUsers.join("\n");
//       alert(`New users found (${checkUsersResult.newUserCount}):\n${newUsersList}\n\nThey will receive invitations.`);
//     }
    
//     await handleAddUsersToBatch(users);
//   };

//   return (
//     <div className="batch-management">
//       <div className="batch-header">
//         <h1>Batch Management</h1>
//         <button 
//           className="btn-create-batch"
//           onClick={() => setShowCreateModal(true)}
//         >
//           + Create New Batch
//         </button>
//       </div>

//       {error && <div className="error-message">{error}</div>}

//       {loading ? (
//         <div className="loading-spinner">Loading batches...</div>
//       ) : (
//         <div className="batch-grid">
//           {batches.map(batch => (
//             <div key={batch.id} className="batch-card">
//               <h3>{batch.name}</h3>
//               <p className="batch-description">{batch.description}</p>
//               <div className="batch-actions">
//                 <button 
//                   className="btn-view-students"
//                   onClick={() => handleViewStudents(batch)}
//                 >
//                   View Students
//                 </button>
//                 <button 
//                   className="btn-add-students"
//                   onClick={() => handleAddStudents(batch)}
//                   title="Add Students"
//                 >
//                   <i className="fas fa-plus"></i>
//                 </button>
//               </div>
//             </div>
//           ))}

//           {batches.length === 0 && !loading && (
//             <div className="no-batches">
//               No batches found. Click "Create New Batch" to add one.
//             </div>
//           )}
//         </div>
//       )}

//       {/* Create Batch Modal */}
//       {showCreateModal && (
//         <div className="modal-overlay">
//           <div className="modal-content">
//             <div className="modal-header">
//               <h2>Create New Batch</h2>
//               <button 
//                 className="modal-close"
//                 onClick={() => {
//                   setShowCreateModal(false);
//                   setFormError("");
//                   setFormSuccess("");
//                   setFormData({ name: "", description: "" });
//                 }}
//               >
//                 ×
//               </button>
//             </div>

//             <form onSubmit={handleCreateBatch}>
//               <div className="form-group">
//                 <label htmlFor="name">Batch Name *</label>
//                 <input
//                   type="text"
//                   id="name"
//                   name="name"
//                   value={formData.name}
//                   onChange={handleInputChange}
//                   placeholder="Enter batch name"
//                   className={formError ? "error" : ""}
//                 />
//               </div>

//               <div className="form-group">
//                 <label htmlFor="description">Description</label>
//                 <textarea
//                   id="description"
//                   name="description"
//                   value={formData.description}
//                   onChange={handleInputChange}
//                   placeholder="Enter batch description"
//                   rows="3"
//                 />
//               </div>

//               {formError && (
//                 <div className="form-error">{formError}</div>
//               )}

//               {formSuccess && (
//                 <div className="form-success">{formSuccess}</div>
//               )}

//               <div className="modal-actions">
//                 <button 
//                   type="button" 
//                   className="btn-cancel"
//                   onClick={() => {
//                     setShowCreateModal(false);
//                     setFormError("");
//                     setFormSuccess("");
//                     setFormData({ name: "", description: "" });
//                   }}
//                 >
//                   Cancel
//                 </button>
//                 <button type="submit" className="btn-submit">
//                   Create Batch
//                 </button>
//               </div>
//             </form>
//           </div>
//         </div>
//       )}

//       {/* Students Modal */}
//       {showStudentsModal && (
//         <div className="modal-overlay">
//           <div className="modal-content students-modal">
//             <div className="modal-header">
//               <h2>Students in {selectedBatch?.name}</h2>
//               <button 
//                 className="modal-close"
//                 onClick={() => {
//                   setShowStudentsModal(false);
//                   setSelectedBatch(null);
//                   setStudents([]);
//                 }}
//               >
//                 ×
//               </button>
//             </div>

//             {studentsLoading ? (
//               <div className="loading-spinner">Loading students...</div>
//             ) : (
//               <div className="students-list">
//                 {students.length > 0 ? (
//                   <table className="students-table">
//                     <thead>
//                       <tr>
//                         <th>Name</th>
//                         <th>Email</th>
//                       </tr>
//                     </thead>
//                     <tbody>
//                       {students.map((student, index) => (
//                         <tr key={index}>
//                           <td>{student.name}</td>
//                           <td>{student.email}</td>
//                         </tr>
//                       ))}
//                     </tbody>
//                   </table>
//                 ) : (
//                   <p className="no-students">No students found in this batch</p>
//                 )}
//               </div>
//             )}

//             <div className="modal-actions">
//               <button 
//                 className="btn-cancel"
//                 onClick={() => {
//                   setShowStudentsModal(false);
//                   setSelectedBatch(null);
//                   setStudents([]);
//                 }}
//               >
//                 Close
//               </button>
//             </div>
//           </div>
//         </div>
//       )}

//       {/* Add Students Modal */}
//       {showAddStudentsModal && (
//         <div className="modal-overlay">
//           <div className="modal-content add-students-modal">
//             <div className="modal-header">
//               <h2>Add Students to {selectedBatch?.name}</h2>
//               <button 
//                 className="modal-close"
//                 onClick={() => {
//                   setShowAddStudentsModal(false);
//                   setAddMethod(null);
//                   setManualEntries([{ name: "", email: "" }]);
//                   setCsvData([]);
//                   setCheckUsersResult(null);
//                   setShowInviteSection(false);
//                 }}
//               >
//                 ×
//               </button>
//             </div>

//             {!addMethod ? (
//               <div className="method-selection">
//                 <h3>Choose addition method:</h3>
//                 <div className="method-buttons">
//                   <button 
//                     className="method-btn"
//                     onClick={() => setAddMethod('manual')}
//                   >
//                     <i className="fas fa-pen"></i>
//                     Manual Entry
//                   </button>
//                   <button 
//                     className="method-btn"
//                     onClick={() => setAddMethod('csv')}
//                   >
//                     <i className="fas fa-file-csv"></i>
//                     CSV Upload
//                   </button>
//                 </div>
//               </div>
//             ) : (
//               <div className="add-method-content">
//                 {addMethod === 'manual' && (
//                   <div className="manual-entries">
//                     <h3>Manual Entry</h3>
//                     {manualEntries.map((entry, index) => (
//                       <div key={index} className="manual-entry-row">
//                         <input
//                           type="text"
//                           placeholder="Name"
//                           value={entry.name}
//                           onChange={(e) => handleManualEntryChange(index, 'name', e.target.value)}
//                         />
//                         <input
//                           type="email"
//                           placeholder="Email"
//                           value={entry.email}
//                           onChange={(e) => handleManualEntryChange(index, 'email', e.target.value)}
//                         />
//                         <button 
//                           className="remove-entry-btn"
//                           onClick={() => removeManualEntry(index)}
//                           disabled={manualEntries.length === 1}
//                         >
//                           <i className="fas fa-times"></i>
//                         </button>
//                       </div>
//                     ))}
//                     <button className="add-entry-btn" onClick={addManualEntry}>
//                       <i className="fas fa-plus"></i> Add Another
//                     </button>
//                   </div>
//                 )}

//                 {addMethod === 'csv' && (
//                   <div className="csv-upload">
//                     <h3>CSV Upload</h3>
//                     <div className="csv-upload-area">
//                       <input
//                         type="file"
//                         accept=".csv"
//                         onChange={handleCSVUpload}
//                         id="csv-input"
//                       />
//                       <label htmlFor="csv-input" className="csv-label">
//                         <i className="fas fa-cloud-upload-alt"></i>
//                         {csvFileName ? csvFileName : "Choose CSV file"}
//                       </label>
//                       <p className="csv-hint">
//                         CSV should have columns: name, email
//                       </p>
//                     </div>
//                     {csvData.length > 0 && (
//                       <div className="csv-preview">
//                         <h4>Preview ({csvData.length} entries)</h4>
//                         <div className="preview-list">
//                           {csvData.slice(0, 5).map((item, idx) => (
//                             <div key={idx} className="preview-item">
//                               <span>{item.name}</span>
//                               <span>{item.email}</span>
//                             </div>
//                           ))}
//                           {csvData.length > 5 && (
//                             <p>... and {csvData.length - 5} more</p>
//                           )}
//                         </div>
//                       </div>
//                     )}
//                   </div>
//                 )}

//                 {showInviteSection && checkUsersResult && !checkUsersResult.allExists && (
//                   <div className="invite-section">
//                     <h3>Invite New Users</h3>
//                     <div className="new-users-info">
//                       <p className="new-users-count">
//                         {checkUsersResult.newUserCount} new user(s) found:
//                       </p>
//                       <ul className="new-users-list">
//                         {checkUsersResult.newUsers.map((email, idx) => (
//                           <li key={idx}>{email}</li>
//                         ))}
//                       </ul>
//                     </div>
//                     <div className="form-group">
//                       <label htmlFor="inviteExpiry">Invitation Expiry (hours)</label>
//                       <input
//                         type="number"
//                         id="inviteExpiry"
//                         min="1"
//                         max="720"
//                         value={inviteExpiryHours}
//                         onChange={(e) => setInviteExpiryHours(e.target.value)}
//                       />
//                     </div>
//                   </div>
//                 )}

//                 <div className="modal-actions">
//                   <button 
//                     className="btn-cancel"
//                     onClick={() => {
//                       setAddMethod(null);
//                       setManualEntries([{ name: "", email: "" }]);
//                       setCsvData([]);
//                       setCheckUsersResult(null);
//                       setShowInviteSection(false);
//                     }}
//                   >
//                     Back
//                   </button>
//                   {!checkUsersResult ? (
//                     <button 
//                       className="btn-submit"
//                       onClick={handleCheckUsers}
//                       disabled={processingUsers}
//                     >
//                       {processingUsers ? "Checking..." : "Check Users"}
//                     </button>
//                   ) : (
//                     <button 
//                       className="btn-submit"
//                       onClick={handleProceedAddUsers}
//                       disabled={processingUsers}
//                     >
//                       {processingUsers ? "Adding..." : "Add to Batch"}
//                     </button>
//                   )}
//                 </div>
//               </div>
//             )}
//           </div>
//         </div>
//       )}
//     </div>
//   );
// }

// export default BatchManagement;
































// src/components/admin/BatchManagement.jsx
import { useState, useEffect } from "react";
import Papa from "papaparse";
import batchManagementApi from "../../api/batchManagementApi";
import "../../styles/BatchManagement.css";

function BatchManagement() {
  const [batches, setBatches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedBatch, setSelectedBatch] = useState(null);
  const [students, setStudents] = useState([]);
  const [showStudentsModal, setShowStudentsModal] = useState(false);
  const [studentsLoading, setStudentsLoading] = useState(false);
  const [batchStudentCounts, setBatchStudentCounts] = useState({});
  
  // Add Students Modal states
  const [showAddStudentsModal, setShowAddStudentsModal] = useState(false);
  const [addMethod, setAddMethod] = useState(null);
  const [manualEntries, setManualEntries] = useState([{ name: "", email: "", emailError: "" }]);
  const [csvData, setCsvData] = useState([]);
  const [csvFileName, setCsvFileName] = useState("");
  const [csvErrors, setCsvErrors] = useState([]);
  const [processingUsers, setProcessingUsers] = useState(false);
  const [checkUsersResult, setCheckUsersResult] = useState(null);
  const [inviteExpiryHours, setInviteExpiryHours] = useState(24);
  const [showInviteSection, setShowInviteSection] = useState(false);
  const [formValid, setFormValid] = useState(false);
  
  // Form state for create batch
  const [formData, setFormData] = useState({
    name: "",
    description: ""
  });
  const [formError, setFormError] = useState("");
  const [formSuccess, setFormSuccess] = useState("");

  // Email validation function
  const validateEmail = (email) => {
    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    if (!email) return "Email is required";
    if (!emailRegex.test(email)) return "Please enter a valid email address";
    return "";
  };

  // Name validation function
  const validateName = (name) => {
    if (!name || !name.trim()) return "Name is required";
    if (name.trim().length < 2) return "Name must be at least 2 characters";
    return "";
  };

  // Check if manual entries are valid
  const validateManualEntries = () => {
    let isValid = true;
    const updatedEntries = manualEntries.map(entry => {
      const nameError = validateName(entry.name);
      const emailError = validateEmail(entry.email);
      if (nameError || emailError) isValid = false;
      return {
        ...entry,
        nameError,
        emailError
      };
    });
    setManualEntries(updatedEntries);
    return isValid;
  };

  // Validate CSV data
  const validateCSVData = (data) => {
    const errors = [];
    const validData = [];
    
    data.forEach((row, index) => {
      const nameError = validateName(row.name);
      const emailError = validateEmail(row.email);
      
      if (!nameError && !emailError) {
        validData.push(row);
      } else {
        errors.push({
          row: index + 1,
          name: row.name,
          email: row.email,
          nameError,
          emailError
        });
      }
    });
    
    return { validData, errors };
  };

  // Fetch all batches using API
  const fetchBatches = async () => {
    try {
      setLoading(true);
      const data = await batchManagementApi.batch.getAllBatches();
      setBatches(data);
      await fetchAllStudentCounts(data);
      setError(null);
    } catch (err) {
      setError(err.error || "Failed to load batches");
      console.error("Error fetching batches:", err);
    } finally {
      setLoading(false);
    }
  };

  // Fetch student counts for all batches
  const fetchAllStudentCounts = async (batchesList) => {
    try {
      const counts = {};
      await Promise.all(
        batchesList.map(async (batch) => {
          try {
            const students = await batchManagementApi.student.getStudentsByBatch(batch.id);
            counts[batch.id] = students.length;
          } catch (err) {
            counts[batch.id] = 0;
          }
        })
      );
      setBatchStudentCounts(counts);
    } catch (err) {
      console.error("Error fetching student counts:", err);
    }
  };

  useEffect(() => {
    fetchBatches();
  }, []);

  // Fetch students for a specific batch using API
  const fetchStudents = async (batchId) => {
    try {
      setStudentsLoading(true);
      const data = await batchManagementApi.student.getStudentsByBatch(batchId);
      setStudents(data);
      setShowStudentsModal(true);
    } catch (err) {
      alert(err.error || "Failed to load students");
      console.error("Error fetching students:", err);
    } finally {
      setStudentsLoading(false);
    }
  };

  // Handle form input change for create batch
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    setFormError("");
  };

  // Handle create batch using API
  const handleCreateBatch = async (e) => {
    e.preventDefault();
    
    if (!formData.name.trim()) {
      setFormError("Batch name is required");
      return;
    }

    try {
      await batchManagementApi.batch.createBatch(formData);
      
      setFormSuccess("Batch created successfully!");
      setFormData({ name: "", description: "" });
      fetchBatches();
      
      setTimeout(() => setFormSuccess(""), 3000);
      setTimeout(() => {
        setShowCreateModal(false);
        setFormSuccess("");
      }, 1000);
      
    } catch (err) {
      setFormError(err.error || "Failed to create batch. Please try again.");
      console.error("Error creating batch:", err);
    }
  };

  // Handle view students
  const handleViewStudents = (batch) => {
    setSelectedBatch(batch);
    fetchStudents(batch.id);
  };

  // Handle add students
  const handleAddStudents = (batch) => {
    setSelectedBatch(batch);
    setAddMethod(null);
    setManualEntries([{ name: "", email: "", nameError: "", emailError: "" }]);
    setCsvData([]);
    setCsvFileName("");
    setCsvErrors([]);
    setCheckUsersResult(null);
    setShowInviteSection(false);
    setInviteExpiryHours(24);
    setShowAddStudentsModal(true);
  };

  // Manual entry handlers
  const handleManualEntryChange = (index, field, value) => {
    const updated = [...manualEntries];
    updated[index][field] = value;
    
    // Clear error for this field when user types
    if (field === 'email') {
      updated[index].emailError = "";
    } else if (field === 'name') {
      updated[index].nameError = "";
    }
    
    setManualEntries(updated);
  };

  const handleManualEntryBlur = (index, field, value) => {
    const updated = [...manualEntries];
    if (field === 'email') {
      updated[index].emailError = validateEmail(value);
    } else if (field === 'name') {
      updated[index].nameError = validateName(value);
    }
    setManualEntries(updated);
  };

  const addManualEntry = () => {
    setManualEntries([...manualEntries, { name: "", email: "", nameError: "", emailError: "" }]);
  };

  const removeManualEntry = (index) => {
    if (manualEntries.length > 1) {
      setManualEntries(manualEntries.filter((_, i) => i !== index));
    }
  };

  // CSV upload handler
  const handleCSVUpload = (event) => {
    const file = event.target.files[0];
    if (!file) return;

    setCsvFileName(file.name);
    setCsvErrors([]);
    
    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        // Check if required columns exist
        const headers = results.meta.fields || [];
        if (!headers.includes('name') || !headers.includes('email')) {
          alert("CSV must contain 'name' and 'email' columns");
          return;
        }

        // Process each row
        const rawData = results.data.map(row => ({
          name: row.name?.trim() || "",
          email: row.email?.trim() || ""
        }));

        // Validate the data
        const { validData, errors } = validateCSVData(rawData);
        
        if (errors.length > 0) {
          setCsvErrors(errors);
        }
        
        if (validData.length > 0) {
          setCsvData(validData);
        } else {
          setCsvData([]);
        }

        if (validData.length === 0 && errors.length > 0) {
          alert("No valid entries found in CSV. Please check the errors below.");
        }
      },
      error: (error) => {
        alert("Error parsing CSV file: " + error.message);
      }
    });
  };

  // Get users array based on selected method
  const getUsersArray = () => {
    if (addMethod === 'manual') {
      return manualEntries
        .filter(entry => entry.name.trim() !== "" && entry.email.trim() !== "")
        .map(({ name, email }) => ({ name: name.trim(), email: email.trim() }));
    } else if (addMethod === 'csv') {
      return csvData;
    }
    return [];
  };

  // Check if form is valid before proceeding
  const isFormValid = () => {
    if (addMethod === 'manual') {
      const hasValidEntries = manualEntries.some(entry => 
        entry.name.trim() !== "" && 
        entry.email.trim() !== "" && 
        !validateName(entry.name) && 
        !validateEmail(entry.email)
      );
      
      const noErrors = manualEntries.every(entry => 
        !entry.nameError && !entry.emailError
      );
      
      return hasValidEntries && noErrors;
    } else if (addMethod === 'csv') {
      return csvData.length > 0 && csvErrors.length === 0;
    }
    return false;
  };

  // Check users before adding using API
  const handleCheckUsers = async () => {
    // Validate based on method
    if (addMethod === 'manual') {
      if (!validateManualEntries()) {
        alert("Please fix the errors in the form");
        return;
      }
    }

    const users = getUsersArray();
    
    if (users.length === 0) {
      alert("Please add at least one valid user");
      return;
    }

    try {
      setProcessingUsers(true);
      const result = await batchManagementApi.student.checkUsers(users);
      setCheckUsersResult(result);

      if (result.allExists) {
        await handleAddUsersToBatch(users);
      } else {
        setShowInviteSection(true);
      }
    } catch (err) {
      alert(err.error || "Error checking users");
    } finally {
      setProcessingUsers(false);
    }
  };

  // Add users to batch using appropriate API
  const handleAddUsersToBatch = async (users) => {
    try {
      if (checkUsersResult && !checkUsersResult.allExists && inviteExpiryHours) {
        await batchManagementApi.student.addNewUsersWithInvite(
          selectedBatch.id,
          users,
          inviteExpiryHours
        );
      } else {
        await batchManagementApi.student.addExistingUsersToBatch(
          selectedBatch.id,
          users
        );
      }

      alert("Users added successfully!");
      
      // Update student count
      setBatchStudentCounts(prev => ({
        ...prev,
        [selectedBatch.id]: (prev[selectedBatch.id] || 0) + users.length
      }));
      
      // Reset and close modal
      setShowAddStudentsModal(false);
      setAddMethod(null);
      setManualEntries([{ name: "", email: "", nameError: "", emailError: "" }]);
      setCsvData([]);
      setCsvErrors([]);
      setCheckUsersResult(null);
      setShowInviteSection(false);
      
      // Refresh students list if modal is open
      if (showStudentsModal) {
        fetchStudents(selectedBatch.id);
      }
      
    } catch (err) {
      alert(err.error || "Error adding users");
    }
  };

  // Proceed with adding users
  const handleProceedAddUsers = async () => {
    const users = getUsersArray();
    
    if (checkUsersResult && !checkUsersResult.allExists) {
      const newUsersList = checkUsersResult.newUsers.join("\n");
      alert(`New users found (${checkUsersResult.newUserCount}):\n${newUsersList}\n\nThey will receive invitations.`);
    }
    
    await handleAddUsersToBatch(users);
  };

  return (
    <div className="batch-management">
      <div className="batch-header">
        <h1>Batch Management</h1>
        <button 
          className="btn-create-batch"
          onClick={() => setShowCreateModal(true)}
        >
          + Create New Batch
        </button>
      </div>

      {error && <div className="error-message">{error}</div>}

      {loading ? (
        <div className="loading-spinner">Loading batches...</div>
      ) : (
        <div className="batch-table-container">
          <table className="batch-table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Batch Name</th>
                <th>Description</th>
                <th>Students Count</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {batches.map(batch => (
                <tr key={batch.id}>
                  <td>{batch.id}</td>
                  <td className="batch-name">{batch.name}</td>
                  <td className="batch-description">{batch.description}</td>
                  <td className="student-count">
                    <span className="count-badge">
                      {batchStudentCounts[batch.id] !== undefined ? batchStudentCounts[batch.id] : 0}
                    </span>
                  </td>
                  <td className="actions">
                    <button 
                      className="btn-view"
                      onClick={() => handleViewStudents(batch)}
                      title="View Students"
                    >
                      <i className="fas fa-eye"></i>
                      <span>View</span>
                    </button>
                    <button 
                      className="btn-add"
                      onClick={() => handleAddStudents(batch)}
                      title="Add Students"
                    >
                      <i className="fas fa-user-plus"></i>
                      <span>Add</span>
                    </button>
                  </td>
                </tr>
              ))}
              {batches.length === 0 && (
                <tr>
                  <td colSpan="5" className="no-data">
                    No batches found. Click "Create New Batch" to add one.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* Create Batch Modal */}
      {showCreateModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h2>Create New Batch</h2>
              <button 
                className="modal-close"
                onClick={() => {
                  setShowCreateModal(false);
                  setFormError("");
                  setFormSuccess("");
                  setFormData({ name: "", description: "" });
                }}
              >
                ×
              </button>
            </div>

            <form onSubmit={handleCreateBatch}>
              <div className="form-group">
                <label htmlFor="name">Batch Name *</label>
                <input
                  type="text"
                  id="name"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  placeholder="Enter batch name"
                  className={formError ? "error" : ""}
                />
              </div>

              <div className="form-group">
                <label htmlFor="description">Description</label>
                <textarea
                  id="description"
                  name="description"
                  value={formData.description}
                  onChange={handleInputChange}
                  placeholder="Enter batch description"
                  rows="3"
                />
              </div>

              {formError && (
                <div className="form-error">{formError}</div>
              )}

              {formSuccess && (
                <div className="form-success">{formSuccess}</div>
              )}

              <div className="modal-actions">
                <button 
                  type="button" 
                  className="btn-cancel"
                  onClick={() => {
                    setShowCreateModal(false);
                    setFormError("");
                    setFormSuccess("");
                    setFormData({ name: "", description: "" });
                  }}
                >
                  Cancel
                </button>
                <button type="submit" className="btn-submit">
                  Create Batch
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Students Modal */}
      {showStudentsModal && (
        <div className="modal-overlay">
          <div className="modal-content students-modal">
            <div className="modal-header">
              <h2>Students in {selectedBatch?.name}</h2>
              <button 
                className="modal-close"
                onClick={() => {
                  setShowStudentsModal(false);
                  setSelectedBatch(null);
                  setStudents([]);
                }}
              >
                ×
              </button>
            </div>

            {studentsLoading ? (
              <div className="loading-spinner">Loading students...</div>
            ) : (
              <div className="students-list">
                {students.length > 0 ? (
                  <table className="students-table">
                    <thead>
                      <tr>
                        <th>Name</th>
                        <th>Email</th>
                      </tr>
                    </thead>
                    <tbody>
                      {students.map((student, index) => (
                        <tr key={index}>
                          <td>{student.name}</td>
                          <td>{student.email}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                ) : (
                  <p className="no-students">No students found in this batch</p>
                )}
              </div>
            )}

            <div className="modal-actions">
              <button 
                className="btn-cancel"
                onClick={() => {
                  setShowStudentsModal(false);
                  setSelectedBatch(null);
                  setStudents([]);
                }}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add Students Modal */}
      {showAddStudentsModal && (
        <div className="modal-overlay">
          <div className="modal-content add-students-modal">
            <div className="modal-header">
              <h2>Add Students to {selectedBatch?.name}</h2>
              <button 
                className="modal-close"
                onClick={() => {
                  setShowAddStudentsModal(false);
                  setAddMethod(null);
                  setManualEntries([{ name: "", email: "", nameError: "", emailError: "" }]);
                  setCsvData([]);
                  setCsvErrors([]);
                  setCheckUsersResult(null);
                  setShowInviteSection(false);
                }}
              >
                ×
              </button>
            </div>

            {!addMethod ? (
              <div className="method-selection">
                <h3>Choose addition method:</h3>
                <div className="method-buttons">
                  <button 
                    className="method-btn"
                    onClick={() => setAddMethod('manual')}
                  >
                    <i className="fas fa-pen"></i>
                    Manual Entry
                  </button>
                  <button 
                    className="method-btn"
                    onClick={() => setAddMethod('csv')}
                  >
                    <i className="fas fa-file-csv"></i>
                    CSV Upload
                  </button>
                </div>
              </div>
            ) : (
              <div className="add-method-content">
                {addMethod === 'manual' && (
                  <div className="manual-entries">
                    <h3>Manual Entry</h3>
                    {manualEntries.map((entry, index) => (
                      <div key={index} className="manual-entry-row">
                        <div className="input-group">
                          <input
                            type="text"
                            placeholder="Full Name"
                            value={entry.name}
                            onChange={(e) => handleManualEntryChange(index, 'name', e.target.value)}
                            onBlur={(e) => handleManualEntryBlur(index, 'name', e.target.value)}
                            className={entry.nameError ? "error" : ""}
                          />
                          {entry.nameError && (
                            <span className="field-error">{entry.nameError}</span>
                          )}
                        </div>
                        <div className="input-group">
                          <input
                            type="email"
                            placeholder="Email Address"
                            value={entry.email}
                            onChange={(e) => handleManualEntryChange(index, 'email', e.target.value)}
                            onBlur={(e) => handleManualEntryBlur(index, 'email', e.target.value)}
                            className={entry.emailError ? "error" : ""}
                          />
                          {entry.emailError && (
                            <span className="field-error">{entry.emailError}</span>
                          )}
                        </div>
                        <button 
                          className="remove-entry-btn"
                          onClick={() => removeManualEntry(index)}
                          disabled={manualEntries.length === 1}
                          title="Remove entry"
                        >
                          <i className="fas fa-times"></i>
                        </button>
                      </div>
                    ))}
                    <button className="add-entry-btn" onClick={addManualEntry}>
                      <i className="fas fa-plus"></i> Add Another Student
                    </button>
                  </div>
                )}

                {addMethod === 'csv' && (
                  <div className="csv-upload">
                    <h3>CSV Upload</h3>
                    <div className="csv-upload-area">
                      <input
                        type="file"
                        accept=".csv"
                        onChange={handleCSVUpload}
                        id="csv-input"
                      />
                      <label htmlFor="csv-input" className="csv-label">
                        <i className="fas fa-cloud-upload-alt"></i>
                        {csvFileName ? csvFileName : "Choose CSV file"}
                      </label>
                      <p className="csv-hint">
                        CSV must have columns: name, email
                      </p>
                    </div>

                    {csvErrors.length > 0 && (
                      <div className="csv-errors">
                        <h4>Validation Errors ({csvErrors.length}):</h4>
                        <div className="errors-list">
                          {csvErrors.map((error, idx) => (
                            <div key={idx} className="error-item">
                              <strong>Row {error.row}:</strong>
                              {error.nameError && <span> {error.nameError}</span>}
                              {error.emailError && <span> {error.emailError}</span>}
                              <small>({error.name} - {error.email})</small>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {csvData.length > 0 && csvErrors.length === 0 && (
                      <div className="csv-preview">
                        <h4>✓ {csvData.length} valid entr{csvData.length === 1 ? 'y' : 'ies'} ready to add</h4>
                        <div className="preview-list">
                          {csvData.slice(0, 5).map((item, idx) => (
                            <div key={idx} className="preview-item valid">
                              <span>{item.name}</span>
                              <span>{item.email}</span>
                            </div>
                          ))}
                          {csvData.length > 5 && (
                            <p>... and {csvData.length - 5} more</p>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {showInviteSection && checkUsersResult && !checkUsersResult.allExists && (
                  <div className="invite-section">
                    <h3>Invite New Users</h3>
                    <div className="new-users-info">
                      <p className="new-users-count">
                        {checkUsersResult.newUserCount} new user(s) found:
                      </p>
                      <ul className="new-users-list">
                        {checkUsersResult.newUsers.map((email, idx) => (
                          <li key={idx}>
                            <i className="fas fa-envelope"></i> {email}
                          </li>
                        ))}
                      </ul>
                    </div>
                    <div className="form-group">
                      <label htmlFor="inviteExpiry">Invitation Expiry (hours)</label>
                      <input
                        type="number"
                        id="inviteExpiry"
                        min="1"
                        max="720"
                        value={inviteExpiryHours}
                        onChange={(e) => setInviteExpiryHours(e.target.value)}
                      />
                      <small className="help-text">Set how many hours the invitation link should be valid</small>
                    </div>
                  </div>
                )}

                <div className="modal-actions">
                  <button 
                    className="btn-cancel"
                    onClick={() => {
                      setAddMethod(null);
                      setManualEntries([{ name: "", email: "", nameError: "", emailError: "" }]);
                      setCsvData([]);
                      setCsvErrors([]);
                      setCheckUsersResult(null);
                      setShowInviteSection(false);
                    }}
                  >
                    <i className="fas fa-arrow-left"></i> Back
                  </button>
                  {!checkUsersResult ? (
                    <button 
                      className="btn-submit"
                      onClick={handleCheckUsers}
                      disabled={processingUsers || !isFormValid()}
                    >
                      {processingUsers ? (
                        <>
                          <i className="fas fa-spinner fa-spin"></i> Checking...
                        </>
                      ) : (
                        <>
                          <i className="fas fa-check-circle"></i> Check Users
                        </>
                      )}
                    </button>
                  ) : (
                    <button 
                      className="btn-submit"
                      onClick={handleProceedAddUsers}
                      disabled={processingUsers}
                    >
                      {processingUsers ? (
                        <>
                          <i className="fas fa-spinner fa-spin"></i> Adding...
                        </>
                      ) : (
                        <>
                          <i className="fas fa-user-plus"></i> Add to Batch
                        </>
                      )}
                    </button>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default BatchManagement;