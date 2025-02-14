// import { useEffect } from "react";
// import { useDispatch, useSelector } from "react-redux";
// import { onAuthStateChanged, User } from "firebase/auth";
// import { auth } from "../config/firebaseConfig";
// import { setUser } from "../redux/authSlice";
// import { RootState } from "../redux/store";

// export const useAuth = () => {
//   const dispatch = useDispatch();
//   const user = useSelector((state: RootState) => state.auth.user);

//   useEffect(() => {
//     const unsubscribe = onAuthStateChanged(auth, (user: User | null) => {
//       if (user) {
//         // Extract only serializable properties
//         const userData = {
//           uid: user.uid,
//           email: user.email,
//           displayName: user.displayName,
//           photoURL: user.photoURL,
//           emailVerified: user.emailVerified,
//         };
//         dispatch(setUser(userData));
//       } else {
//         dispatch(setUser(null));
//       }
//     });

//     return () => unsubscribe();
//   }, [dispatch]);

//   return user;
// };
import { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { onAuthStateChanged } from "firebase/auth";
import { auth } from "../config/firebaseConfig";
import { setUser } from "../redux/authSlice";
import { RootState } from "../redux/store";

export const useAuth = () => {
  const dispatch = useDispatch();
  const user = useSelector((state: RootState) => state.auth.user);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        dispatch(
          setUser({
            uid: user.uid,
            email: user.email,
            displayName: user.displayName,
          })
        );
      } else {
        dispatch(setUser(null));
      }
    });
    return () => unsubscribe();
  }, [dispatch]);

  return user; // ✅ Only return serializable user data
};
