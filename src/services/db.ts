import { 
  collection, addDoc, updateDoc, doc, query, where, orderBy, 
  onSnapshot, getDocs, writeBatch, serverTimestamp, getDoc 
} from 'firebase/firestore';
import { db } from './firebase';

export type UnifiedStatus = 'reported' | 'acknowledged' | 'in-progress' | 'resolved' | 'false-alarm';

export type IssueType = 
  | 'Total blackout' 
  | 'Partial outage' 
  | 'Intermittent power' 
  | 'Low voltage' 
  | 'Power surge' 
  | 'Electrical fault' 
  | 'Other';

export const ISSUE_CATEGORIES: Record<IssueType, string> = {
  'Total blackout': 'Power Loss',
  'Partial outage': 'Power Loss',
  'Intermittent power': 'Power Instability',
  'Low voltage': 'Power Instability',
  'Power surge': 'Power Instability',
  'Electrical fault': 'Electrical Fault / Unspecified',
  'Other': 'Electrical Fault / Unspecified'
};

export interface OutageReport {
  id?: string;
  uid: string;
  userName?: string;
  location: string;
  issueType: IssueType;
  description: string;
  incidentId?: string; // Link to the aggregated incident
  status: UnifiedStatus;
  createdAt: any;
  resolvedAt?: any;
}

export interface Incident {
  id?: string;
  location: string;
  mainIssueType: IssueType;
  category: string;
  status: UnifiedStatus;
  reportCount: number;
  reports: string[]; // Array of report IDs
  createdAt: any;
  updatedAt: any;
}

export interface Location {
  id?: string;
  name: string;
}

export interface Notification {
  id?: string;
  uid: string;
  title: string;
  message: string;
  read: boolean;
  createdAt: any;
}

export interface MaintenanceSchedule {
  id?: string;
  locations: string[]; // Changed from single location string to array
  startTime: string;
  endTime: string;
  description: string;
  createdAt: any;
}

// --- Helpers ---
export const formatDate = (date: any) => {
  if (!date) return 'Just now';
  
  // Handle Firestore Timestamp
  if (typeof date.toDate === 'function') {
    return date.toDate().toLocaleString([], { 
      dateStyle: 'medium', 
      timeStyle: 'short' 
    });
  }
  
  // Handle JS Date or numeric timestamp
  const d = new Date(date);
  if (isNaN(d.getTime())) return 'Just now';
  
  return d.toLocaleString([], { 
    dateStyle: 'medium', 
    timeStyle: 'short' 
  });
};

// --- Locations ---
export const getLocations = async () => {
  const snapshot = await getDocs(collection(db, 'locations'));
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Location));
};

export const subscribeToLocations = (callback: (locations: Location[]) => void) => {
  return onSnapshot(collection(db, 'locations'), (snapshot) => {
    const locations = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Location));
    callback(locations);
  });
};

export const addLocation = async (name: string) => {
  return addDoc(collection(db, 'locations'), { name });
};

// --- Reports & Incidents ---

const findMatchingIncident = async (location: string, issueType: IssueType) => {
  const category = ISSUE_CATEGORIES[issueType];
  const threeHoursAgo = new Date(Date.now() - 3 * 60 * 60 * 1000);
  
  // An incident is "active" if it's not resolved or a false alarm
  // We query for 'reported' status as the primary active state for matching
  const q = query(
    collection(db, 'incidents'),
    where('location', '==', location),
    where('status', 'in', ['reported', 'acknowledged', 'in-progress']),
    where('createdAt', '>=', threeHoursAgo)
  );

  const snapshot = await getDocs(q);
  
  for (const docSnap of snapshot.docs) {
    const incident = docSnap.data() as Incident;
    
    // Matching logic:
    // - Exact same issue type OR
    // - Same category OR
    // - New issue is "Other"
    if (
      incident.mainIssueType === issueType ||
      incident.category === category ||
      issueType === 'Other'
    ) {
      return { id: docSnap.id, ...incident };
    }
  }
  
  return null;
};

export const createReport = async (reportData: Omit<OutageReport, 'id' | 'status' | 'createdAt'>) => {
  try {
    const timestamp = serverTimestamp();
    
    // 1. Find or Create Incident
    let incident = await findMatchingIncident(reportData.location, reportData.issueType);
    let incidentId = incident?.id;

    if (!incidentId) {
      // Create NEW incident
      const newIncident: Omit<Incident, 'id'> = {
        location: reportData.location,
        mainIssueType: reportData.issueType,
        category: ISSUE_CATEGORIES[reportData.issueType],
        status: 'reported',
        reportCount: 1,
        reports: [], // Will add report ID after creation
        createdAt: timestamp,
        updatedAt: timestamp
      };
      const incidentRef = await addDoc(collection(db, 'incidents'), newIncident);
      incidentId = incidentRef.id;
    } else {
      // Update existing incident count
      const incidentRef = doc(db, 'incidents', incidentId);
      await updateDoc(incidentRef, {
        reportCount: (incident.reportCount || 0) + 1,
        updatedAt: timestamp
      });
    }

    // 2. Create the Report
    const fullReportData: Omit<OutageReport, 'id'> = {
      ...reportData,
      incidentId,
      status: 'reported',
      createdAt: timestamp
    };
    const reportRef = await addDoc(collection(db, 'reports'), fullReportData);
    
    // 3. Add report ID to incident's reports array
    const incidentRef = doc(db, 'incidents', incidentId);
    const incidentSnap = await getDoc(incidentRef);
    const currentReports = incidentSnap.data()?.reports || [];
    await updateDoc(incidentRef, {
      reports: [...currentReports, reportRef.id]
    });

    // 4. Create notification for the user
    await addNotification(reportData.uid, "Report Submitted", `Your report for ${reportData.location} has been received.`);
    
    return reportRef.id;
  } catch (error) {
    console.error("Error creating report:", error);
    throw error;
  }
};

export const updateReportStatus = async (reportId: string, status: UnifiedStatus, feedback?: string) => {
  try {
    const reportRef = doc(db, 'reports', reportId);
    const reportSnap = await getDoc(reportRef);
    const reportData = reportSnap.data() as OutageReport;

    const updateData: any = { status };
    if (status === 'resolved') {
      updateData.resolvedAt = serverTimestamp();
    }

    await updateDoc(reportRef, updateData);

    // Create notification
    await addNotification(
      reportData.uid, 
      "Status Update", 
      `Your report status has been updated to ${status.replace('-', ' ')}.${feedback ? ` Feedback: ${feedback}` : ''}`
    );
  } catch (error) {
    console.error("Error updating report status:", error);
    throw error;
  }
};

export const subscribeToUsers = (callback: (users: any[]) => void) => {
  return onSnapshot(collection(db, 'users'), (snapshot) => {
    callback(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
  });
};

export const subscribeToAllIncidents = (callback: (incidents: Incident[]) => void) => {
  const q = query(collection(db, 'incidents'), orderBy('createdAt', 'desc'));
  return onSnapshot(q, (snapshot) => {
    const incidents = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Incident));
    callback(incidents);
  });
};

export const subscribeToReportsByIncident = (incidentId: string, callback: (reports: OutageReport[]) => void) => {
  const q = query(collection(db, 'reports'), where('incidentId', '==', incidentId), orderBy('createdAt', 'desc'));
  return onSnapshot(q, (snapshot) => {
    const reports = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as OutageReport));
    callback(reports);
  });
};

export const updateIncidentStatus = async (incidentId: string, status: UnifiedStatus, feedback: string) => {
  const batch = writeBatch(db);
  const incidentRef = doc(db, 'incidents', incidentId);
  const timestamp = serverTimestamp();

  batch.update(incidentRef, { status, updatedAt: timestamp });

  // Update all reports under this incident
  const reportsQuery = query(collection(db, 'reports'), where('incidentId', '==', incidentId));
  const reportsSnap = await getDocs(reportsQuery);
  
  reportsSnap.docs.forEach(docSnap => {
    const reportRef = doc(db, 'reports', docSnap.id);
    // SYNC: Exact same status propagates to all reports
    const reportUpdate: any = { status };
    if (status === 'resolved') {
      reportUpdate.resolvedAt = timestamp;
    }
    batch.update(reportRef, reportUpdate);
    
    // Create notification for each reporter
    const reportData = docSnap.data() as OutageReport;
    const notifRef = doc(collection(db, 'notifications'));
    batch.set(notifRef, {
      uid: reportData.uid,
      title: `Update: ${status.toUpperCase().replace('-', ' ')}`,
      message: feedback,
      read: false,
      createdAt: timestamp
    });
  });

  await batch.commit();
};

export const bulkUpdateReportsByLocation = async (locationName: string, status: UnifiedStatus, feedback: string) => {
  const q = query(collection(db, 'reports'), where('location', '==', locationName), where('status', '!=', 'resolved'));
  const snapshot = await getDocs(q);
  const batch = writeBatch(db);

  snapshot.docs.forEach(docSnap => {
    const reportRef = doc(db, 'reports', docSnap.id);
    batch.update(reportRef, { status });
    
    // Notifications are typically added individually or via a background function
    // For simplicity here, we'll add them to the batch if we had a notifications collection ready
    const reportData = docSnap.data() as OutageReport;
    const notifRef = doc(collection(db, 'notifications'));
    batch.set(notifRef, {
      uid: reportData.uid,
      title: "Area Update",
      message: `Update for ${locationName}: ${feedback}`,
      read: false,
      createdAt: serverTimestamp()
    });
  });

  await batch.commit();
};

export const subscribeToUserReports = (uid: string, callback: (reports: OutageReport[]) => void, onError?: (error: any) => void) => {
  const q = query(
    collection(db, 'reports'),
    where('uid', '==', uid),
    orderBy('createdAt', 'desc')
  );

  return onSnapshot(q, (snapshot) => {
    const reports = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as OutageReport));
    callback(reports);
  }, onError);
};

export const subscribeToReportsByLocation = (location: string, callback: (reports: OutageReport[]) => void) => {
  const q = query(
    collection(db, 'reports'),
    where('location', '==', location)
  );
  return onSnapshot(q, (snapshot) => {
    const reports = snapshot.docs
      .map(doc => ({ id: doc.id, ...doc.data() } as OutageReport))
      .sort((a, b) => {
        const dateA = a.createdAt?.toDate ? a.createdAt.toDate() : new Date(a.createdAt);
        const dateB = b.createdAt?.toDate ? b.createdAt.toDate() : new Date(b.createdAt);
        return dateB - dateA;
      });
    callback(reports);
  });
};

export const subscribeToAllReports = (callback: (reports: OutageReport[]) => void) => {
  const q = query(collection(db, 'reports'), orderBy('createdAt', 'desc'));

  return onSnapshot(q, (snapshot) => {
    const reports = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as OutageReport));
    callback(reports);
  }, (error) => {
    console.error("Error listening to all reports:", error);
  });
};

// --- Notifications ---
export const addNotification = async (uid: string, title: string, message: string) => {
  return addDoc(collection(db, 'notifications'), {
    uid,
    title,
    message,
    read: false,
    createdAt: serverTimestamp()
  });
};

export const subscribeToUserNotifications = (uid: string, callback: (notifications: Notification[]) => void) => {
  const q = query(
    collection(db, 'notifications'),
    where('uid', '==', uid),
    orderBy('createdAt', 'desc')
  );

  return onSnapshot(q, (snapshot) => {
    const notifs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Notification));
    callback(notifs);
  });
};

export const markNotificationsRead = async (uid: string) => {
  const q = query(collection(db, 'notifications'), where('uid', '==', uid), where('read', '==', false));
  const snapshot = await getDocs(q);
  
  const batch = writeBatch(db);
  snapshot.docs.forEach(docSnap => {
    batch.update(doc(db, 'notifications', docSnap.id), { read: true });
  });
  
  await batch.commit();
};

// --- Maintenance Schedule ---
export const addSchedule = async (schedule: Omit<MaintenanceSchedule, 'id' | 'createdAt'>) => {
  const docRef = await addDoc(collection(db, 'schedules'), {
    ...schedule,
    createdAt: serverTimestamp()
  });

  // Notify all users in ALL locations
  const batch = writeBatch(db);
  
  for (const location of schedule.locations) {
    // Find users who have reported in this location
    const q = query(collection(db, 'reports'), where('location', '==', location));
    const snapshot = await getDocs(q);
    const uids = new Set(snapshot.docs.map(d => d.data().uid));
    
    // Also find all users in 'users' collection with this location
    const usersQ = query(collection(db, 'users'), where('location', '==', location));
    const usersSnapshot = await getDocs(usersQ);
    usersSnapshot.docs.forEach(d => uids.add(d.id));
    
    uids.forEach(uid => {
      const notifRef = doc(collection(db, 'notifications'));
      batch.set(notifRef, {
        uid,
        title: "Planned Maintenance",
        message: `Maintenance scheduled for ${location} from ${schedule.startTime} to ${schedule.endTime}. ${schedule.description}`,
        read: false,
        createdAt: serverTimestamp()
      });
    });
  }
  
  await batch.commit();

  return docRef.id;
};

export const subscribeToSchedules = (callback: (schedules: MaintenanceSchedule[]) => void) => {
  const q = query(collection(db, 'schedules'), orderBy('createdAt', 'desc'));
  return onSnapshot(q, (snapshot) => {
    const schedules = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as MaintenanceSchedule));
    callback(schedules);
  });
};

export const updateSchedule = async (scheduleId: string, updates: Partial<MaintenanceSchedule>) => {
  const docRef = doc(db, 'schedules', scheduleId);
  await updateDoc(docRef, {
    ...updates,
    updatedAt: serverTimestamp()
  });
};

export const deleteSchedule = async (scheduleId: string) => {
  const docRef = doc(db, 'schedules', scheduleId);
  // Optional: implement actual deletion or soft delete
  // await deleteDoc(docRef); 
};

// --- User Management (for SuperAdmin) ---
export interface SystemUser {
  id?: string;
  email?: string;
  role: 'user' | 'admin' | 'superadmin';
  location?: string;
  createdAt?: any;
}

export const subscribeToAllUsers = (callback: (users: SystemUser[]) => void) => {
  const q = query(collection(db, 'users'), orderBy('createdAt', 'desc'));
  return onSnapshot(q, (snapshot) => {
    const users = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    } as SystemUser));
    callback(users);
  });
};

export const updateUserRole = async (userId: string, role: 'user' | 'admin' | 'superadmin') => {
  const userRef = doc(db, 'users', userId);
  await updateDoc(userRef, { role });
};

// Note: To create users with createUserWithEmailAndPassword, we need to use the Firebase Admin SDK on a server.
// For client-side, we can create a Firestore record, but actual auth user creation requires admin privileges.
export const createUserRecord = async (email: string, role: 'user' | 'admin' = 'user', location?: string) => {
  await addDoc(collection(db, 'users'), {
    email,
    role,
    location: location || null,
    createdAt: serverTimestamp(),
    pending: true // Mark as pending until user signs up
  });
};

export const checkActiveMaintenance = async (location: string) => {
  const now = new Date();
  const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const endOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);

  const q = query(
    collection(db, 'schedules'),
    where('location', '==', location)
  );
  
  const snapshot = await getDocs(q);
  
  // Find any schedule that overlaps with today
  return snapshot.docs.find(doc => {
    const data = doc.data();
    const schedStart = new Date(data.startTime);
    const schedEnd = new Date(data.endTime);
    
    // Check if the schedule exists on this day
    return (schedStart <= endOfDay && schedEnd >= startOfDay);
  });
};
