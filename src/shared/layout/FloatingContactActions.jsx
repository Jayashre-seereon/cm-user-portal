import { useState } from "react";
import { Button, Input, Modal, message as toast } from "antd";
import { MessageOutlined, PhoneOutlined, WhatsAppOutlined } from "@ant-design/icons";
import { sendUserMessage } from "../../api/sendMessageApi";

const PHONE = "+919776808179";

export default function FloatingContactActions() {
  const [open, setOpen] = useState(false);
  const [text, setText] = useState("");
  const [sending, setSending] = useState(false);

  const submit = async () => {
    if (!text.trim()) return;
    setSending(true);
    try {
      await sendUserMessage(text.trim());
      toast.success("Your message has been sent.");
      setText("");
      setOpen(false);
    } catch (error) {
      toast.error(error?.response?.data?.message || "Could not send your message.");
    } finally {
      setSending(false);
    }
  };

  return <>
    <div className="fixed right-3 top-1/2 z-[1000] flex -translate-y-1/2 flex-col gap-3 sm:right-5" aria-label="Contact CareerMap">
      <a href={`tel:${PHONE}`} aria-label="Call CareerMap" title="Call" className="flex h-12 w-12 items-center justify-center rounded-full bg-[#9a2119] text-xl text-white shadow-lg transition hover:scale-105 hover:bg-[#7f1711]"><PhoneOutlined /></a>
      <a href={`https://wa.me/${PHONE.replace(/\D/g, "")}`} target="_blank" rel="noreferrer" aria-label="WhatsApp CareerMap" title="WhatsApp" className="flex h-12 w-12 items-center justify-center rounded-full bg-[#25D366] text-2xl text-white shadow-lg transition hover:scale-105 hover:bg-[#1eae53]"><WhatsAppOutlined /></a>
      <button type="button" onClick={() => setOpen(true)} aria-label="Send a message" title="Send a message" className="flex h-12 w-12 items-center justify-center rounded-full bg-white text-xl text-[#9a2119] shadow-lg ring-1 ring-[#f0e4e2] transition hover:scale-105"><MessageOutlined /></button>
    </div>
    <Modal title="Send us a message" open={open} onCancel={() => setOpen(false)} footer={null} destroyOnHidden>
      <p className="mb-3 text-sm text-gray-600">We’ll include your account name, email, and phone number.</p>
      <Input.TextArea rows={4} maxLength={5000} showCount value={text} onChange={(event) => setText(event.target.value)} placeholder="Write your message" />
      <div className="mt-4 flex justify-end"><Button type="primary" loading={sending} disabled={!text.trim()} onClick={submit}>Send message</Button></div>
    </Modal>
  </>;
}
