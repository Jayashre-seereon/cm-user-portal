import { Layout } from "antd";
import { Outlet } from "react-router-dom";
import WebsiteFooter from "./WebsiteFooter";
import WebsiteNavbar from "./WebsiteNavbar";
import CareerBeeLauncher from "../careerBee/CareerBeeLauncher";

const { Content } = Layout;

export default function WebsiteLayout() {
  return (
    <Layout className="app-shell min-h-screen !bg-transparent">
      <WebsiteNavbar />
      <Content className="px-3 py-4 md:px-6 md:py-6">
        <div className="mx-auto max-w-[1280px]">
          <Outlet />
        </div>
      </Content>
      <WebsiteFooter />
      <CareerBeeLauncher />
    </Layout>
  );
}
