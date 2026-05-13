import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import type { User } from 'firebase/auth';
import { doc, getDoc, setDoc, collection, getDocs, addDoc, query, where, onSnapshot, serverTimestamp } from 'firebase/firestore';
import { auth, db } from '../services/firebase';

interface AuthContextType {
  user: User | null;
  role: 'user' | 'admin' | 'superadmin' | null;
  location: string | null;
  locationChangeRequested: boolean;
  unreadNotifications: number;
  pendingLocationRequests: number;
  pendingIncidents: number;
  loading: boolean;
  updateUserLocation: (newLocation: string) => Promise<void>;
  requestLocationChange: (reason: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({ 
  user: null, 
  role: null, 
  location: null,
  locationChangeRequested: false,
  unreadNotifications: 0,
  pendingLocationRequests: 0,
  pendingIncidents: 0,
  loading: true,
  updateUserLocation: async () => {},
  requestLocationChange: async () => {}
});

export const useAuth = () => useContext(AuthContext);

// Seed initial locations if none exist
const seedLocations = async () => {
  const locsRef = collection(db, 'locations');
  const snapshot = await getDocs(locsRef);
  if (snapshot.empty) {
    const initialLocs = [
      "Gachororo", "Highpoint", "Witeithie", "Joyland", 
      "Gate C", "Sears", "Kalimoni", "Kenyatta Road"
    ];
    for (const name of initialLocs) {
      await addDoc(locsRef, { name, activeIncidents: 0 });
    }
    console.log("Seeded initial locations");
  }
};

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [role, setRole] = useState<'user' | 'admin' | 'superadmin' | null>(null);
  const [location, setLocation] = useState<string | null>(null);
  const [locationChangeRequested, setLocationChangeRequested] = useState(false);
  const [unreadNotifications, setUnreadNotifications] = useState(0);
  const [pendingLocationRequests, setPendingLocationRequests] = useState(0);
  const [pendingIncidents, setPendingIncidents] = useState(0);
  const [loading, setLoading] = useState(true);
  const [notificationUnsub, setNotificationUnsub] = useState<(() => void) | null>(null);
  const [requestsUnsub, setRequestsUnsub] = useState<(() => void) | null>(null);
  const [incidentsUnsub, setIncidentsUnsub] = useState<(() => void) | null>(null);

  const updateUserLocation = async (newLocation: string) => {
    if (!user) return;
    const userDocRef = doc(db, 'users', user.uid);
    await setDoc(userDocRef, { location: newLocation }, { merge: true });
    setLocation(newLocation);
  };

  const requestLocationChange = async (reason: string) => {
    if (!user) return;
    const userDocRef = doc(db, 'users', user.uid);
    await setDoc(userDocRef, { 
      locationChangeRequested: true,
      locationChangeReason: reason,
      locationChangeTimestamp: new Date().toISOString()
    }, { merge: true });
    setLocationChangeRequested(true);
    
    // Also create a notification for admin (optional but recommended)
    await addDoc(collection(db, 'notifications'), {
      uid: 'admin', // or a specific admin ID if available
      title: 'Location Change Request',
      message: `${user.email} has requested to change their location. Reason: ${reason}`,
      read: false,
      createdAt: new Date().toISOString(),
      fromUid: user.uid
    });
  };

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged(async (firebaseUser) => {
      // Clear previous listeners
      if (notificationUnsub) {
        notificationUnsub();
        setNotificationUnsub(null);
      }
      if (requestsUnsub) {
        requestsUnsub();
        setRequestsUnsub(null);
      }
      if (incidentsUnsub) {
        incidentsUnsub();
        setIncidentsUnsub(null);
      }

      if (firebaseUser) {
        setUser(firebaseUser);
        
        // Fetch or create user role in Firestore
        try {
          const userDocRef = doc(db, 'users', firebaseUser.uid);
          const userDoc = await getDoc(userDocRef);
          
          if (userDoc.exists()) {
            const data = userDoc.data();
            setRole(data.role as 'user' | 'admin' | 'superadmin');
            setLocation(data.location || null);
            setLocationChangeRequested(!!data.locationChangeRequested);
          } else {
            // Create a new user record with default 'user' role
            await setDoc(userDocRef, {
              email: firebaseUser.email,
              role: 'user',
              location: null,
              createdAt: new Date().toISOString()
            });
            setRole('user');
            setLocation(null);
            setLocationChangeRequested(false);
          }

          // Subscribe to unread notifications
          const q = query(collection(db, 'notifications'), where('uid', '==', firebaseUser.uid), where('read', '==', false));
          const unsubNotifs = onSnapshot(q, (snapshot) => {
            setUnreadNotifications(snapshot.size);
          });
          setNotificationUnsub(() => unsubNotifs);

          // If admin or superadmin, subscribe to pending requests and incidents
          const isAdminOrSuper = ['admin', 'superadmin'].includes(userDoc.exists() ? userDoc.data().role : 'user');
          if (isAdminOrSuper) {
            // Subscribe to pending location change requests
            const reqQ = query(collection(db, 'users'), where('locationChangeRequested', '==', true));
            const unsubReqs = onSnapshot(reqQ, (snapshot) => {
              setPendingLocationRequests(snapshot.size);
            });
            setRequestsUnsub(() => unsubReqs);

            // Subscribe to pending incidents (status is 'reported')
            const incQ = query(collection(db, 'incidents'), where('status', '==', 'reported'));
            const unsubInc = onSnapshot(incQ, (snapshot) => {
              setPendingIncidents(snapshot.size);
            });
            setIncidentsUnsub(() => unsubInc);
          }

          // If admin or superadmin, ensure locations are seeded
          if (isAdminOrSuper) {
            seedLocations().catch(err => {
              console.warn("Auto-seeding skipped (likely permissions):", err.message);
            });
          }
        } catch (error: any) {
          console.error("AuthContext: Error accessing user profile:", error.message);
          setRole('user');
          setLocation(null);
        }
      } else {
        setUser(null);
        setRole(null);
        setLocation(null);
        setLocationChangeRequested(false);
        setUnreadNotifications(0);
        setPendingLocationRequests(0);
        setPendingIncidents(0);
      }
      setLoading(false);
    });

    return () => {
      unsubscribe();
      if (notificationUnsub) {
        notificationUnsub();
      }
      if (requestsUnsub) {
        requestsUnsub();
      }
      if (incidentsUnsub) {
        incidentsUnsub();
      }
    };
  }, []);

  return (
    <AuthContext.Provider value={{ 
      user, role, location, locationChangeRequested, unreadNotifications, 
      pendingLocationRequests, pendingIncidents, loading, 
      updateUserLocation, requestLocationChange 
    }}>
      {children}
    </AuthContext.Provider>
  );
};
