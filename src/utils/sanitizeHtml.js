// Lightweight allow-list HTML sanitiser (no external dependency).
const ALLOWED_TAGS = new Set([
  "a", "abbr", "b", "blockquote", "br", "caption", "code", "col", "colgroup", "dd", "div", "dl", "dt",
  "em", "h1", "h2", "h3", "h4", "h5", "h6", "hr", "i", "img", "li", "ol", "p", "pre", "s", "small",
  "span", "strike", "strong", "sub", "sup", "table", "tbody", "td", "tfoot", "th", "thead", "tr", "u", "ul",
]);
const ALLOWED_ATTRS = new Set(["href", "src", "alt", "title", "colspan", "rowspan", "target", "rel", "class", "style", "width", "height"]);
const DROP_WITH_CONTENT = new Set(["script", "style", "iframe", "object", "embed", "noscript", "template", "svg", "math", "form", "link", "meta", "base"]);

function isSafeUrl(value) {
  const compact = String(value || "").replace(/[\u0000-\u0020]/g, "").toLowerCase();
  if (!compact) return true;
  if (/^(https?:|mailto:|tel:|#|\/|\.)/.test(compact)) return true;
  if (/^data:image\/(png|jpe?g|gif|webp);/.test(compact)) return true;
  return !/^[a-z][a-z0-9+.-]*:/.test(compact);
}

function cleanNode(node) {
  Array.from(node.childNodes).forEach((child) => {
    if (child.nodeType === 8) {
      node.removeChild(child);
      return;
    }
    if (child.nodeType !== 1) return;
    const tag = child.tagName.toLowerCase();
    if (DROP_WITH_CONTENT.has(tag)) {
      node.removeChild(child);
      return;
    }
    if (!ALLOWED_TAGS.has(tag)) {
      cleanNode(child);
      while (child.firstChild) node.insertBefore(child.firstChild, child);
      node.removeChild(child);
      return;
    }
    Array.from(child.attributes).forEach((attr) => {
      const name = attr.name.toLowerCase();
      if (!ALLOWED_ATTRS.has(name) || name.startsWith("on")) {
        child.removeAttribute(attr.name);
        return;
      }
      if ((name === "href" || name === "src") && !isSafeUrl(attr.value)) {
        child.removeAttribute(attr.name);
        return;
      }
      if (name === "style" && /expression\s*\(|url\s*\(|javascript:|@import/i.test(attr.value)) {
        child.removeAttribute(attr.name);
      }
    });
    if (tag === "a" && child.getAttribute("target") === "_blank") {
      child.setAttribute("rel", "noopener noreferrer");
    }
    cleanNode(child);
  });
}

export function sanitizeHtml(html) {
  if (!html) return "";
  const input = String(html);
  if (typeof DOMParser === "undefined") {
    return input.replace(/<[^>]*>/g, "");
  }
  const doc = new DOMParser().parseFromString(input, "text/html");
  cleanNode(doc.body);
  return doc.body.innerHTML;
}

export default sanitizeHtml;
