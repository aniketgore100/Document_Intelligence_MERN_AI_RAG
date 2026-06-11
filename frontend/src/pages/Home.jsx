import { useSelector } from "react-redux";
import { ROLES } from "../constants/roles";
import GlobalHomeView from "../components/home/GlobalHomeView";
import DeptAdminHomeView from "../components/home/DeptAdminHomeView";
import OrgAdminDashboard from "./OrgAdminDashboard";
import OrgAdminDocuments from "./OrgAdminDocuments";

const Home = () => {
  const roleName = useSelector((state) => state.auth.user?.roleName);
  if (roleName === ROLES.ORG_ADMIN) {
    return <OrgAdminDashboard />;
  }
  if(roleName === ROLES.GLOBAL_ADMIN){
    return <GlobalHomeView />;
  }
  if (roleName === ROLES.DEPT_ADMIN) {
    return <DeptAdminHomeView />;
  }
  if (roleName === ROLES.USER) {
    return <OrgAdminDocuments />;
  }
  return <section className="min-h-[58vh] p-1" />;
  
};

export default Home;
