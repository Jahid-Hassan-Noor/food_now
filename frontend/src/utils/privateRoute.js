// src/utils/privateRoute.js

import {Route, Redirect} from "react-router-dom";
import {useContext} from "react";
import { withAuth } from "@/utils/withAuth";

const PrivateRoute = ({children, ...rest}) => {
  const { user } = useContext(withAuth);
  return (
    <Route {...rest}>{user ? children : <Redirect to="/login" />}</Route>
  );
};
export default PrivateRoute;