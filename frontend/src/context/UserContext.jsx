// import React, { createContext, useState, useEffect } from "react";
// import axios from "axios";

// export const UserContext = createContext();

// export const UserProvider = ({ children }) => {
//   const [user, setUser] = useState(null);

//   useEffect(() => {
//     // Vérifier si un token est stocké
//     const token = localStorage.getItem("token");
//     if (token) {
//       // Appeler l'endpoint pour récupérer les infos utilisateur
//       axios
//         .get("http://localhost:5001/api/auth/me", {
//           headers: { Authorization: `Bearer ${token}` },
//         })
//         .then((res) => {
//           // On suppose que la réponse contient { user: { ... } }
//           setUser(res.data.user);
//         })
//         .catch((err) => {
//           console.error(
//             "Erreur lors de la récupération de l'utilisateur :",
//             err
//           );
//           // En cas d'erreur (token invalide), on peut le retirer
//           localStorage.removeItem("token");
//         });
//     }
//   }, []);

//   return (
//     <UserContext.Provider value={{ user, setUser }}>
//       {children}
//     </UserContext.Provider>
//   );
// };

import React, { createContext, useState, useEffect } from "react";
import axios from "axios";

export const UserContext = createContext();

export const UserProvider = ({ children }) => {
  const [user, setUser] = useState(null);

  // Au chargement, vérifier s'il y a un token en localStorage
  useEffect(() => {
    const token = localStorage.getItem("token");
    if (token) {
      axios
        .get("http://localhost:5001/api/auth/me", {
          headers: { Authorization: `Bearer ${token}` },
        })
        .then((res) => {
          // On suppose que l'endpoint renvoie { user: { ... } }
          setUser(res.data.user);
        })
        .catch((err) => {
          console.error(
            "Erreur lors de la récupération de l'utilisateur :",
            err
          );
          // En cas d'erreur, vous pouvez retirer le token
          localStorage.removeItem("token");
        });
    }
  }, []);

  return (
    <UserContext.Provider value={{ user, setUser }}>
      {children}
    </UserContext.Provider>
  );
};

export default UserProvider;
