import {
  CloseOutlined,
  ExclamationCircleOutlined,
  InfoCircleOutlined,
  PlusOutlined,
  ReloadOutlined,
  RightOutlined,
  SendOutlined,
} from "@ant-design/icons";
import { Fragment, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { askChatbot, CHATBOT_DEFAULT_CONFIG, getChatbotConfig } from "../../api/chatbotApi";
import Bee from "../../asset/bee.png";
import { useAuthStore } from "../../store/authStore";
import { resolveNavigationTarget } from "../../utils/searchNavigation";
import { getChatOwnerKey, loadConversation, saveConversation } from "./careerBeeSession";

const HISTORY_LIMIT = 20;
const MOBILE_QUERY = "(max-width: 639.98px)";
const NETWORK_ERROR_TEXT = "I couldn't reach CareerMap just now. Please check your connection and try again.";
const DEFAULT_LIMIT_TEXT = "You're asking very fast - please wait a moment and try again.";

function createId(prefix) {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

function isMobileWidth() {
  try {
    return window.matchMedia(MOBILE_QUERY).matches;
  } catch {
    return false;
  }
}

function useIsMobile() {
  const [mobile, setMobile] = useState(isMobileWidth);

  useEffect(() => {
    let query;
    try {
      query = window.matchMedia(MOBILE_QUERY);
    } catch {
      return undefined;
    }
    const update = () => setMobile(query.matches);
    update();
    query.addEventListener?.("change", update);
    return () => query.removeEventListener?.("change", update);
  }, []);

  return mobile;
}

/* ---------- Safe light-Markdown rendering (React elements only) ---------- */

function renderInline(text, keyPrefix) {
  const parts = String(text).split(/(\*\*[^*\n]+?\*\*)/g);
  return parts.map((part, index) => {
    if (/^\*\*[^*\n]+?\*\*$/.test(part)) {
      return (
        <strong key={`${keyPrefix}-${index}`} className="font-semibold text-[#241d1e]">
          {part.slice(2, -2)}
        </strong>
      );
    }
    return <Fragment key={`${keyPrefix}-${index}`}>{part}</Fragment>;
  });
}

function parseBlocks(text) {
  const lines = String(text || "").replace(/\r\n?/g, "\n").split("\n");
  const blocks = [];
  let paragraph = null;
  let list = null;

  const flushParagraph = () => {
    if (paragraph?.length) blocks.push({ type: "p", lines: paragraph });
    paragraph = null;
  };
  const flushList = () => {
    if (list?.items.length) blocks.push(list);
    list = null;
  };

  lines.forEach((line) => {
    const trimmed = line.trim();

    if (!trimmed) {
      flushParagraph();
      flushList();
      return;
    }

    const bullet = /^[-•]\s+(.*)$/.exec(trimmed);
    const ordered = /^(\d{1,3})[.)]\s+(.*)$/.exec(trimmed);

    if (bullet || ordered) {
      flushParagraph();
      const type = bullet ? "ul" : "ol";
      if (list && list.type !== type) flushList();
      if (!list) list = { type, start: ordered ? Number(ordered[1]) : 1, items: [] };
      list.items.push(bullet ? bullet[1] : ordered[2]);
      return;
    }

    flushList();
    const heading = /^#{1,6}\s+(.*)$/.exec(trimmed);
    if (!paragraph) paragraph = [];
    paragraph.push(heading ? `**${heading[1].replace(/\*\*/g, "")}**` : trimmed);
  });

  flushParagraph();
  flushList();
  return blocks;
}

function RichText({ text }) {
  const blocks = useMemo(() => parseBlocks(text), [text]);

  return (
    <div className="space-y-2">
      {blocks.map((block, blockIndex) => {
        if (block.type === "ul" || block.type === "ol") {
          const ListTag = block.type;
          return (
            <ListTag
              key={`b-${blockIndex}`}
              start={block.type === "ol" && block.start !== 1 ? block.start : undefined}
              className={`m-0 space-y-1 pl-5 ${block.type === "ul" ? "list-disc" : "list-decimal"}`}
            >
              {block.items.map((item, itemIndex) => (
                <li key={`b-${blockIndex}-${itemIndex}`} className="pl-0.5 marker:text-[#9a2119]">
                  {renderInline(item, `b-${blockIndex}-${itemIndex}`)}
                </li>
              ))}
            </ListTag>
          );
        }

        return (
          <p key={`b-${blockIndex}`} className="m-0">
            {block.lines.map((line, lineIndex) => (
              <Fragment key={`b-${blockIndex}-${lineIndex}`}>
                {lineIndex > 0 ? <br /> : null}
                {renderInline(line, `b-${blockIndex}-${lineIndex}`)}
              </Fragment>
            ))}
          </p>
        );
      })}
    </div>
  );
}

function toPlainText(text) {
  return String(text || "")
    .replace(/\*\*/g, "")
    .replace(/^#{1,6}\s+/gm, "")
    .trim();
}

/* ---------- Link / page chips ---------- */

function getLinkBadge(item = {}) {
  const type = String(item.type || "").toLowerCase();
  const group = String(item.group || "").toLowerCase();
  const has = (types, groups) => types.includes(type) || groups.includes(group);

  if (has(["stream", "category", "secondcategory", "subcategory", "careerpath", "career"], ["careers"])) {
    return { label: item.badge || "Career", className: "bg-purple-50 text-purple-700 border-purple-200" };
  }
  if (has(["institution", "college", "institute"], ["institutions", "colleges"])) {
    return { label: item.badge || "College", className: "bg-blue-50 text-blue-700 border-blue-200" };
  }
  if (has(["entranceexam", "exam"], ["entranceexams", "exams"])) {
    return { label: item.badge || "Exam", className: "bg-amber-50 text-amber-700 border-amber-200" };
  }
  if (has(["mentor"], ["mentors"])) {
    return { label: item.badge || "Mentor", className: "bg-emerald-50 text-emerald-700 border-emerald-200" };
  }
  if (has(["scholarship"], ["scholarships"])) {
    return { label: item.badge || "Scholarship", className: "bg-rose-50 text-rose-700 border-rose-200" };
  }
  if (has(["studyabroad"], ["studyabroad"])) {
    return { label: item.badge || "Study Abroad", className: "bg-cyan-50 text-cyan-700 border-cyan-200" };
  }
  if (has(["masterclass"], ["masterclasses"])) {
    return { label: item.badge || "Video", className: "bg-fuchsia-50 text-fuchsia-700 border-fuchsia-200" };
  }
  if (has(["quiz"], ["quizzes"])) {
    return { label: item.badge || "Quiz", className: "bg-yellow-50 text-yellow-800 border-yellow-200" };
  }
  if (has(["newsletter"], ["newsletters"])) {
    return { label: item.badge || "Career Insights", className: "bg-red-50 text-[#9a2119] border-red-200" };
  }
  return { label: item.badge || item.type || "Explore", className: "bg-[#fdf0ee] text-[#9a2119] border-[#f2d1c7]" };
}

function LinkCards({ links, onOpen }) {
  if (!links?.length) return null;

  return (
    <ul className="m-0 mt-2 list-none space-y-1.5 p-0" aria-label="Suggested results">
      {links.map((item, index) => {
        if (!item || typeof item.title !== "string") return null;
        const badge = getLinkBadge(item);
        return (
          <li key={`${item.type || "item"}-${item.id ?? index}-${index}`}>
            <button
              type="button"
              onClick={() => onOpen(item)}
              className="group flex w-full items-center gap-2 rounded-xl border border-[#eaded9] bg-white px-2.5 py-2 text-left transition hover:border-[#9a2119]/40 hover:bg-[#fdf0ed] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#9a2119]/30"
            >
              <span className="min-w-0 flex-1">
                <span className="flex items-center gap-1.5">
                  <span className="truncate text-[12.5px] font-semibold text-[#241d1e] group-hover:text-[#9a2119]">
                    {item.title}
                  </span>
                  <span
                    className={`shrink-0 rounded-full border px-1.5 py-px text-[9.5px] font-bold uppercase tracking-wider ${badge.className}`}
                  >
                    {badge.label}
                  </span>
                </span>
                {item.subtitle ? (
                  <span className="block truncate text-[11px] text-[#8c6c67]">{item.subtitle}</span>
                ) : null}
              </span>
              <RightOutlined className="shrink-0 text-[10px] text-gray-300 group-hover:text-[#9a2119]" aria-hidden="true" />
            </button>
          </li>
        );
      })}
    </ul>
  );
}

function PageButtons({ pages, onOpen }) {
  const validPages = (pages || []).filter(
    (page) => page && typeof page.web === "string" && page.web.startsWith("/") && !page.web.startsWith("//")
  );
  if (!validPages.length) return null;

  return (
    <div className="mt-2 flex flex-wrap gap-1.5">
      {validPages.map((page, index) => (
        <button
          key={`${page.key || page.web}-${index}`}
          type="button"
          onClick={() => onOpen(page)}
          className="inline-flex items-center gap-1 rounded-full bg-[#9a2119] px-3 py-1.5 text-[11.5px] font-semibold text-white shadow-sm transition hover:bg-[#6c160f] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#9a2119]/40 focus-visible:ring-offset-1"
        >
          Open {page.label || "page"}
          <RightOutlined className="text-[9px]" aria-hidden="true" />
        </button>
      ))}
    </div>
  );
}

/* ---------- Bubbles ---------- */

function BeeAvatar() {
  return (
    <span className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full border border-[#f2d1c7] bg-[#fdf0ed]" aria-hidden="true">
      <img src={Bee} alt="" className="h-5 w-5 object-contain" draggable={false} />
    </span>
  );
}

function AssistantRow({ children, label = "Career Bee" }) {
  return (
    <div className="flex items-start gap-2" role="group" aria-label={label}>
      <BeeAvatar />
      <div className="min-w-0 max-w-[85%]">{children}</div>
    </div>
  );
}

function MessageItem({ message, onOpenLink, onOpenPage, onRetry, retryDisabled }) {
  if (message.role === "user") {
    return (
      <div className="flex justify-end" role="group" aria-label="You">
        <div className="max-w-[85%] whitespace-pre-wrap break-words rounded-2xl rounded-br-md bg-[#9a2119] px-3.5 py-2.5 text-[13px] leading-5 text-white shadow-sm">
          {message.content}
        </div>
      </div>
    );
  }

  if (message.kind === "notice") {
    return (
      <AssistantRow>
        <div className="flex items-start gap-2 rounded-2xl rounded-tl-md border border-amber-200 bg-amber-50 px-3.5 py-2.5 text-[12.5px] leading-5 text-amber-800">
          <InfoCircleOutlined className="mt-[3px] shrink-0" aria-hidden="true" />
          <span>{message.content}</span>
        </div>
      </AssistantRow>
    );
  }

  if (message.kind === "error") {
    return (
      <AssistantRow>
        <div className="rounded-2xl rounded-tl-md border border-red-200 bg-red-50 px-3.5 py-2.5 text-[12.5px] leading-5 text-red-700">
          <div className="flex items-start gap-2">
            <ExclamationCircleOutlined className="mt-[3px] shrink-0" aria-hidden="true" />
            <span>{message.content}</span>
          </div>
          {message.retryText ? (
            <button
              type="button"
              onClick={() => onRetry(message)}
              disabled={retryDisabled}
              className="mt-2 inline-flex items-center gap-1.5 rounded-full border border-red-200 bg-white px-3 py-1 text-[11.5px] font-semibold text-[#9a2119] transition hover:border-[#9a2119] disabled:cursor-not-allowed disabled:opacity-50"
            >
              <ReloadOutlined className="text-[11px]" aria-hidden="true" />
              Retry
            </button>
          ) : null}
        </div>
      </AssistantRow>
    );
  }

  return (
    <AssistantRow>
      <div className="break-words rounded-2xl rounded-tl-md border border-[#eaded9] bg-[#faf7f5] px-3.5 py-2.5 text-[13px] leading-5 text-[#3a2d2f]">
        <RichText text={message.content} />
      </div>
      <LinkCards links={message.links} onOpen={onOpenLink} />
      <PageButtons pages={message.pages} onOpen={onOpenPage} />
    </AssistantRow>
  );
}

function TypingIndicator() {
  return (
    <AssistantRow label="Career Bee is typing">
      <div className="inline-flex items-center gap-1 rounded-2xl rounded-tl-md border border-[#eaded9] bg-[#faf7f5] px-3.5 py-3">
        {[0, 1, 2].map((dot) => (
          <span
            key={dot}
            className="career-bee-dot h-1.5 w-1.5 rounded-full bg-[#9a2119]"
            style={{ animationDelay: `${dot * 0.15}s` }}
          />
        ))}
        <span className="sr-only">Career Bee is typing…</span>
      </div>
    </AssistantRow>
  );
}

/* ---------- Panel ---------- */

// Desktop card: 380x560 above the launcher (launcher 56px at bottom 20px + 16px gap).
const DESKTOP_GAP_BOTTOM = 92;
const DESKTOP_HEIGHT = 560;
const DESKTOP_MIN_HEIGHT = 360;

function useViewportHeight() {
  const [height, setHeight] = useState(() => window.innerHeight);
  useEffect(() => {
    const update = () => setHeight(window.innerHeight);
    window.addEventListener("resize", update);
    return () => window.removeEventListener("resize", update);
  }, []);
  return height;
}

function getDesktopPlacement(viewportHeight, lift) {
  const bottom = DESKTOP_GAP_BOTTOM + lift;
  const available = viewportHeight - bottom - 16;
  if (available >= DESKTOP_MIN_HEIGHT) {
    return { bottom, height: Math.min(DESKTOP_HEIGHT, available) };
  }
  // Not enough room above a lifted launcher: sit lower (over the launcher) instead of shrinking.
  const height = Math.max(0, Math.min(DESKTOP_HEIGHT, viewportHeight - 32));
  return { bottom: Math.max(16, Math.min(bottom, viewportHeight - 16 - height)), height };
}

export default function CareerBeePanel({ open, onClose, lift = 0 }) {
  const navigate = useNavigate();
  const user = useAuthStore((state) => state.user);
  const ownerKey = getChatOwnerKey(user);
  const isMobile = useIsMobile();
  const viewportHeight = useViewportHeight();

  const [config, setConfig] = useState(null);
  const [chat, setChat] = useState(() => ({ owner: ownerKey, list: loadConversation(ownerKey) }));
  const [draft, setDraft] = useState("");
  const [sending, setSending] = useState(false);
  const [announcement, setAnnouncement] = useState("");

  const panelRef = useRef(null);
  const listRef = useRef(null);
  const textareaRef = useRef(null);
  const abortRef = useRef(null);
  const chatRef = useRef(chat);
  chatRef.current = chat;

  // Conversation belongs to the signed-in user (or "guest"); switch when that changes.
  if (chat.owner !== ownerKey) {
    setChat({ owner: ownerKey, list: loadConversation(ownerKey) });
  }

  useEffect(() => {
    abortRef.current?.abort();
    abortRef.current = null;
    setSending(false);
  }, [ownerKey]);

  useEffect(() => {
    saveConversation(chat.owner, chat.list);
  }, [chat]);

  // Config is fetched only once the panel has been opened (this component is lazy-mounted on first open).
  useEffect(() => {
    let active = true;
    getChatbotConfig().then((nextConfig) => {
      if (active) setConfig(nextConfig);
    });
    return () => {
      active = false;
    };
  }, []);

  useEffect(
    () => () => {
      abortRef.current?.abort();
    },
    []
  );

  const effectiveConfig = config || CHATBOT_DEFAULT_CONFIG;
  const maxLength = effectiveConfig.maxMessageLength || 1000;
  const botName = effectiveConfig.name || "Career Bee";
  const disabled = config?.enabled === false;
  const messages = chat.list;
  const trimmedDraft = draft.trim();
  const canSend = Boolean(trimmedDraft) && !sending && !disabled && trimmedDraft.length <= maxLength;

  // Auto-scroll to the newest message.
  useEffect(() => {
    if (!open) return undefined;
    const frame = window.requestAnimationFrame(() => {
      const list = listRef.current;
      if (list) list.scrollTop = list.scrollHeight;
    });
    return () => window.cancelAnimationFrame(frame);
  }, [open, messages, sending, config]);

  // Focus management when opened.
  useEffect(() => {
    if (!open) return undefined;
    const frame = window.requestAnimationFrame(() => {
      if (isMobileWidth()) {
        panelRef.current?.focus();
      } else {
        textareaRef.current?.focus();
      }
    });
    return () => window.cancelAnimationFrame(frame);
  }, [open]);

  // Esc closes the panel (focus returns to the launcher).
  useEffect(() => {
    if (!open) return undefined;
    function handleKeyDown(event) {
      if (event.key !== "Escape" || event.defaultPrevented) return;
      const target = event.target;
      const inPanel = panelRef.current?.contains(target);
      const onPage = target === document.body || target?.getAttribute?.("aria-controls") === "career-bee-panel";
      if (inPanel || onPage) {
        event.preventDefault();
        onClose();
      }
    }
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [open, onClose]);

  // Full-screen sheet on phones: stop the page behind it from scrolling.
  useEffect(() => {
    if (!open || !isMobile) return undefined;
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previous;
    };
  }, [open, isMobile]);

  // Grow the textarea with its content (up to ~5 lines).
  useEffect(() => {
    const textarea = textareaRef.current;
    if (!textarea) return;
    textarea.style.height = "auto";
    textarea.style.height = `${Math.min(textarea.scrollHeight, 120)}px`;
  }, [draft, open]);

  const appendMessage = useCallback((entry) => {
    setChat((current) => ({ ...current, list: [...current.list, entry] }));
  }, []);

  const send = useCallback(
    async (rawText, { pendingUserId = null } = {}) => {
      const text = String(rawText || "").trim();
      if (!text || abortRef.current || disabled) return;
      if (text.length > maxLength) return;

      const owner = chatRef.current.owner;
      const userId = pendingUserId || createId("user");
      const history = chatRef.current.list
        .filter((entry) => entry.id !== userId && !entry.kind && (entry.role === "user" || entry.role === "assistant"))
        .map((entry) => ({ role: entry.role, content: entry.content }))
        .slice(-HISTORY_LIMIT);

      if (!pendingUserId) {
        appendMessage({ id: userId, role: "user", content: text });
        setDraft("");
      }

      const controller = new AbortController();
      abortRef.current = controller;
      setSending(true);
      setAnnouncement("");

      try {
        const result = await askChatbot({ message: text, history, signal: controller.signal });
        if (controller.signal.aborted || chatRef.current.owner !== owner) return;

        const reply = result.reply?.trim()
          ? result.reply
          : "Sorry, I couldn't find an answer to that. Try asking in a different way.";
        appendMessage({
          id: createId("assistant"),
          role: "assistant",
          content: reply,
          links: result.links,
          pages: result.pages,
        });
        setAnnouncement(`${botName}: ${toPlainText(reply)}`);
      } catch (error) {
        if (controller.signal.aborted || error?.name === "CanceledError" || chatRef.current.owner !== owner) return;

        const status = error?.response?.status;
        const serverMessage =
          typeof error?.response?.data?.message === "string" ? error.response.data.message : "";

        if (status === 429 || status === 400) {
          const content = serverMessage || (status === 429 ? DEFAULT_LIMIT_TEXT : "Please check your message and try again.");
          appendMessage({ id: createId("notice"), role: "assistant", kind: "notice", content });
          setAnnouncement(content);
        } else {
          const content = status ? serverMessage || "Career Bee is unavailable right now. Please try again." : NETWORK_ERROR_TEXT;
          appendMessage({
            id: createId("error"),
            role: "assistant",
            kind: "error",
            content,
            retryText: text,
            retryUserId: userId,
          });
          setAnnouncement(content);
        }
      } finally {
        if (abortRef.current === controller) {
          abortRef.current = null;
          setSending(false);
        }
      }
    },
    [appendMessage, botName, disabled, maxLength]
  );

  const handleRetry = useCallback(
    (errorEntry) => {
      if (abortRef.current) return;
      setChat((current) => ({ ...current, list: current.list.filter((entry) => entry.id !== errorEntry.id) }));
      const userStillThere = chatRef.current.list.some((entry) => entry.id === errorEntry.retryUserId);
      send(errorEntry.retryText, { pendingUserId: userStillThere ? errorEntry.retryUserId : null });
    },
    [send]
  );

  const handleNewChat = useCallback(() => {
    abortRef.current?.abort();
    abortRef.current = null;
    setSending(false);
    setDraft("");
    setAnnouncement("Started a new chat.");
    setChat((current) => ({ ...current, list: [] }));
    textareaRef.current?.focus();
  }, []);

  const afterNavigate = useCallback(() => {
    if (isMobileWidth()) onClose({ restoreFocus: false });
  }, [onClose]);

  // Same navigation logic as a global-search result (GlobalSearchBar → handleSelectItem).
  const handleOpenLink = useCallback(
    (item) => {
      if (!item) return;
      const targetUrl = resolveNavigationTarget(item);
      afterNavigate();
      if (/^https?:\/\//i.test(targetUrl)) {
        window.location.href = targetUrl;
      } else {
        navigate(targetUrl, { state: { searchItem: item } });
      }
    },
    [afterNavigate, navigate]
  );

  const handleOpenPage = useCallback(
    (page) => {
      const path = String(page?.web || "");
      if (!path.startsWith("/") || path.startsWith("//")) return;
      afterNavigate();
      navigate(path);
    },
    [afterNavigate, navigate]
  );

  function handleSubmit(event) {
    event.preventDefault();
    if (canSend) send(draft);
  }

  function handleKeyDown(event) {
    if (event.key === "Enter" && !event.shiftKey && !event.nativeEvent?.isComposing) {
      event.preventDefault();
      if (canSend) send(draft);
    }
  }

  const showStarters = messages.length === 0 && Boolean(config) && !disabled;
  const showCounter = draft.length >= maxLength - 200;

  return (
    <div
      ref={panelRef}
      id="career-bee-panel"
      role="dialog"
      aria-modal={isMobile ? "true" : "false"}
      aria-labelledby="career-bee-title"
      aria-describedby="career-bee-subtitle"
      tabIndex={-1}
      style={isMobile ? undefined : getDesktopPlacement(viewportHeight, lift)}
      className={`${
        open ? "career-bee-pop flex" : "hidden"
      } fixed inset-0 z-[995] h-[100dvh] flex-col overflow-hidden bg-white focus:outline-none sm:inset-auto sm:right-4 sm:w-[380px] sm:rounded-2xl sm:border sm:border-[#eaded9] sm:shadow-2xl`}
    >
      {/* Header */}
      <div className="brand-gradient flex shrink-0 items-center gap-3 px-3.5 py-3 text-white" style={{ paddingTop: "max(0.75rem, env(safe-area-inset-top, 0px))" }}>
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-white shadow-sm" aria-hidden="true">
          <img src={Bee} alt="" className="h-7 w-7 object-contain" draggable={false} />
        </span>
        <div className="min-w-0 flex-1">
          <h2 id="career-bee-title" className="m-0 truncate text-[15px] font-bold leading-5 text-white">
            {botName}
          </h2>
          <p id="career-bee-subtitle" className="m-0 truncate text-[11.5px] font-medium leading-4 text-white/80">
            Always here for you
          </p>
        </div>
        <button
          type="button"
          onClick={handleNewChat}
          disabled={messages.length === 0 && !sending}
          title="Start a new chat"
          aria-label="Start a new chat"
          className="inline-flex h-8 shrink-0 items-center gap-1 rounded-full bg-white/15 px-2.5 text-[11.5px] font-semibold text-white transition hover:bg-white/25 focus:outline-none focus-visible:ring-2 focus-visible:ring-white/70 disabled:cursor-not-allowed disabled:opacity-50"
        >
          <PlusOutlined className="text-[11px]" aria-hidden="true" />
          New chat
        </button>
        <button
          type="button"
          onClick={() => onClose()}
          aria-label="Close Career Bee"
          title="Close"
          className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-white/15 text-white transition hover:bg-white/25 focus:outline-none focus-visible:ring-2 focus-visible:ring-white/70"
        >
          <CloseOutlined className="text-[13px]" aria-hidden="true" />
        </button>
      </div>

      {/* Messages */}
      <div
        ref={listRef}
        role="log"
        aria-live="off"
        aria-label={`Conversation with ${botName}`}
        className="career-bee-scroll min-h-0 flex-1 space-y-3 overflow-y-auto bg-white px-3.5 py-4"
      >
        {config ? (
          <AssistantRow>
            <div className="break-words rounded-2xl rounded-tl-md border border-[#eaded9] bg-[#faf7f5] px-3.5 py-2.5 text-[13px] leading-5 text-[#3a2d2f]">
              <RichText text={effectiveConfig.greeting} />
            </div>
          </AssistantRow>
        ) : (
          <TypingIndicator />
        )}

        {disabled ? (
          <MessageItem
            message={{ role: "assistant", kind: "notice", content: `${botName} is not available right now. Please try again later.` }}
          />
        ) : null}

        {showStarters ? (
          <div className="flex flex-wrap gap-1.5 pl-9" aria-label="Suggested questions">
            {effectiveConfig.starterPrompts.map((prompt) => (
              <button
                key={prompt}
                type="button"
                onClick={() => send(prompt)}
                disabled={sending}
                className="rounded-full border border-[#f2d1c7] bg-[#fdf7f5] px-3 py-1.5 text-left text-[11.5px] font-semibold text-[#9a2119] transition hover:border-[#9a2119] hover:bg-[#fdf0ed] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#9a2119]/30 disabled:opacity-50"
              >
                {prompt}
              </button>
            ))}
          </div>
        ) : null}

        {messages.map((message) => (
          <MessageItem
            key={message.id}
            message={message}
            onOpenLink={handleOpenLink}
            onOpenPage={handleOpenPage}
            onRetry={handleRetry}
            retryDisabled={sending}
          />
        ))}

        {sending ? <TypingIndicator /> : null}
      </div>

      <div className="sr-only" role="status" aria-live="polite" aria-atomic="true">
        {announcement}
      </div>

      {/* Composer */}
      <form
        onSubmit={handleSubmit}
        className="shrink-0 border-t border-[#f2e9e6] bg-white px-3 pt-2.5"
        style={{ paddingBottom: "max(0.625rem, env(safe-area-inset-bottom, 0px))" }}
      >
        <div className="flex items-end gap-2 rounded-2xl border border-[#eaded9] bg-[#faf7f5] py-1.5 pl-3 pr-1.5 transition focus-within:border-[#9a2119] focus-within:bg-white focus-within:ring-2 focus-within:ring-[#9a2119]/10">
          <label htmlFor="career-bee-input" className="sr-only">
            Message {botName}
          </label>
          <textarea
            id="career-bee-input"
            ref={textareaRef}
            rows={1}
            value={draft}
            maxLength={maxLength}
            disabled={disabled}
            onChange={(event) => setDraft(event.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={`Ask ${botName} anything...`}
            aria-describedby={showCounter ? "career-bee-counter" : undefined}
            className="max-h-[120px] min-h-[36px] flex-1 resize-none border-0 bg-transparent py-2 text-[13px] leading-5 text-[#241d1e] placeholder-[#9b8f97] focus:outline-none disabled:cursor-not-allowed"
          />
          <button
            type="submit"
            disabled={!canSend}
            aria-label="Send message"
            title="Send"
            className="mb-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#9a2119] text-white shadow-sm transition hover:bg-[#6c160f] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#9a2119]/40 focus-visible:ring-offset-1 disabled:cursor-not-allowed disabled:bg-[#c9a7a2] disabled:shadow-none"
          >
            <SendOutlined className="text-[14px]" aria-hidden="true" />
          </button>
        </div>
        <div className="flex items-center justify-between gap-2 px-1 pb-0.5 pt-1.5 text-[10.5px] text-[#9b8f97]">
          <span className="truncate">Enter to send · Shift+Enter for a new line</span>
          {showCounter ? (
            <span
              id="career-bee-counter"
              className={`shrink-0 font-semibold ${draft.length >= maxLength ? "text-[#9a2119]" : "text-[#8c6c67]"}`}
            >
              {draft.length}/{maxLength}
            </span>
          ) : null}
        </div>
      </form>
    </div>
  );
}
