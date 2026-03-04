import { createContext, useContext, useState, useCallback } from "react";

/**
 * MDMContext — in-memory MDM queue (localStorage-backed for demo persistence)
 *
 * Stores pending/approved/rejected master data submissions.
 * On-prem: swap localStorage with backend API calls via api.js
 */

const MDMContext = createContext(null);
const LS_KEY = "erp_mdm_queue";

function loadQueue() {
  try { return JSON.parse(localStorage.getItem(LS_KEY) || "[]"); } catch { return []; }
}
function saveQueue(q) {
  try { localStorage.setItem(LS_KEY, JSON.stringify(q)); } catch {}
}

export function MDMProvider({ children }) {
  const [queue, setQueueState] = useState(loadQueue);

  const setQueue = useCallback((updater) => {
    setQueueState(prev => {
      const next = typeof updater === "function" ? updater(prev) : updater;
      saveQueue(next);
      return next;
    });
  }, []);

  // Submit a new master data record for approval
  const submitMDM = useCallback((type, data, requestedBy) => {
    const entry = {
      id: `mdm_${Date.now()}_${Math.random().toString(36).slice(2,7)}`,
      type,
      data,
      status: "pending",
      requestedBy: { id: requestedBy.id, name: requestedBy.name, role: requestedBy.role },
      requestedAt: new Date().toISOString(),
      processedBy: null,
      processedAt: null,
      rejectionReason: null,
    };
    setQueue(q => [entry, ...q]);
    return entry.id;
  }, [setQueue]);

  // Admin: add directly (bypasses approval)
  const addDirectly = useCallback((type, data, addedBy) => {
    const entry = {
      id: `mdm_${Date.now()}_${Math.random().toString(36).slice(2,7)}`,
      type,
      data: { ...data, mdm_status: "active" },
      status: "approved",
      requestedBy:  { id: addedBy.id, name: addedBy.name, role: addedBy.role },
      requestedAt:  new Date().toISOString(),
      processedBy:  { id: addedBy.id, name: addedBy.name },
      processedAt:  new Date().toISOString(),
      rejectionReason: null,
    };
    setQueue(q => [entry, ...q]);
    return entry.id;
  }, [setQueue]);

  // Approve a pending submission
  const approveMDM = useCallback((id, approvedBy) => {
    setQueue(q => q.map(e =>
      e.id === id
        ? { ...e, status: "approved", data: { ...e.data, mdm_status: "active" }, processedBy: { id: approvedBy.id, name: approvedBy.name }, processedAt: new Date().toISOString() }
        : e
    ));
  }, [setQueue]);

  // Reject a pending submission
  const rejectMDM = useCallback((id, rejectedBy, reason) => {
    setQueue(q => q.map(e =>
      e.id === id
        ? { ...e, status: "rejected", rejectionReason: reason, processedBy: { id: rejectedBy.id, name: rejectedBy.name }, processedAt: new Date().toISOString() }
        : e
    ));
  }, [setQueue]);

  // Deactivate an active record (soft delete)
  const deactivateMDM = useCallback((id) => {
    setQueue(q => q.map(e =>
      e.id === id ? { ...e, status: "inactive", data: { ...e.data, mdm_status: "inactive" } } : e
    ));
  }, [setQueue]);

  // Get all approved/active records of a type (to merge with seed data)
  const getActive = useCallback((type) =>
    queue.filter(e => e.type === type && e.status === "approved").map(e => e.data)
  , [queue]);

  // Get all pending records of a type (show with ⏳ badge)
  const getPending = useCallback((type) =>
    queue.filter(e => e.type === type && e.status === "pending").map(e => ({ ...e.data, _mdmId: e.id, _mdmStatus: "pending", _mdmBy: e.requestedBy?.name, _mdmAt: e.requestedAt }))
  , [queue]);

  const pendingCount = queue.filter(e => e.status === "pending").length;
  const pendingByType = (type) => queue.filter(e => e.type === type && e.status === "pending").length;

  return (
    <MDMContext.Provider value={{
      queue, pendingCount, pendingByType,
      submitMDM, addDirectly, approveMDM, rejectMDM, deactivateMDM,
      getActive, getPending,
    }}>
      {children}
    </MDMContext.Provider>
  );
}

export const useMDM = () => {
  const ctx = useContext(MDMContext);
  if (!ctx) throw new Error("useMDM must be used inside MDMProvider");
  return ctx;
};
