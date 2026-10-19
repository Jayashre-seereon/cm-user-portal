import { MailOutlined } from "@ant-design/icons";
import { Alert, Button, Form, Input, Space, Typography } from "antd";
import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { forgotPassword, getApiErrorMessage } from "../../../api/authApi";
import { AuthShell } from "../components/AuthShell";
import { authPrimaryButtonStyle } from "../components/authShared";

const { Text } = Typography;

export default function ForgotPasswordPage() {
  const navigate = useNavigate();
  const [form] = Form.useForm();
  const [status, setStatus] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(values) {
    try {
      setIsSubmitting(true);
      setStatus(null);

      const response = await forgotPassword(values.email.trim());
      setStatus({
        type: "success",
        message: response?.message || "If the email exists, a reset link has been sent.",
      });
      form.resetFields();
    } catch (error) {
      setStatus({
        type: "error",
        message: getApiErrorMessage(error, "Failed to send password reset email."),
      });
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <AuthShell title="Forgot Password" subtitle="Enter your email address and we will send a reset link." backTo="/login?userType=existing">
      <Space orientation="vertical" size="large" style={{ width: "100%" }}>
        <Form form={form} layout="vertical" className="cm-form-label" onFinish={handleSubmit} requiredMark={false}>
          <Form.Item
            label="Email Address"
            name="email"
            rules={[
              { required: true, message: "Please enter your email address." },
              { type: "email", message: "Enter a valid email address." },
            ]}
          >
            <Input
              className="cm-input-field"
              prefix={<MailOutlined style={{ color: "#9a2119" }} />}
              size="large"
              style={{ borderRadius: "10px" }}
              autoComplete="email"
              placeholder="you@example.com"
            />
          </Form.Item>

          <Button type="primary" htmlType="submit" block size="large" loading={isSubmitting} style={{ ...authPrimaryButtonStyle, width: "100%" }}>
            {isSubmitting ? "Sending Link..." : "Send Reset Link"}
          </Button>
        </Form>

        {status ? <Alert type={status.type} message={status.message} showIcon style={{ borderRadius: "10px" }} /> : null}


        <div style={{ textAlign: "center", fontSize: "13px" }}>
          <button
            type="button"
            onClick={() => navigate("/login?userType=existing")}
            style={{
              border: "none",
              background: "transparent",
              color: "#9a2119",
              fontWeight: "700",
              cursor: "pointer",
              padding: 0,
            }}
          >
            Back to login
          </button>
        </div>
      </Space>
    </AuthShell>
  );
}
