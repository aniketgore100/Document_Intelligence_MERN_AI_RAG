import { useSelector } from "react-redux";
import { ROLES } from "../constants/roles";

const getDashboardName = (roleName) => {
  if (roleName === ROLES.GLOBAL_ADMIN) return "Global Admin Dashboard";
  if (roleName === ROLES.ORG_ADMIN) return "Organization Admin Dashboard";
  if (roleName === ROLES.DEPT_ADMIN) return "Department Admin Dashboard";
  return "User Dashboard";
};

const Home = () => {
  const roleName = useSelector((state) => state.auth.user?.roleName);

  return (
    <section className="p-1">
      <h2 className="text-base font-medium text-slate-800 dark:text-slate-100">
        {getDashboardName(roleName)}
      </h2>
    </section>
  );
};

export default Home;
