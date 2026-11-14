
import { useEffect, useMemo, useState } from "react";
import { Alert, Button, Select } from "antd";
import {
  EnvironmentOutlined,
  LeftOutlined,
  RightOutlined,
  LockOutlined,
  UnlockOutlined,
} from "@ant-design/icons";
import { State } from "country-state-city";

import { getInstitutes, getCategories } from "../../../api/instituteApi";
import { globalSearch } from "../../../api/searchApi";
import { institutes as fallbackInstitutes } from "../../../data/careermapData";
import { ModuleScreen, PageHero } from "../../../components/ui";
import {
  UnlockRedirectModal,
  usePortalNavigation,
} from "../../portal/components/portalPageShared";

function getInitials(name = "") {
  return name
    .split(" ")
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase())
    .join("");
}

function normalizeInstituteSearch(value = "") {
  return String(value)
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLocaleLowerCase()
    .replace(/[^\p{L}\p{N}]+/gu, "");
}

function sameInstituteName(left = "", right = "") {
  const normalizedLeft = normalizeInstituteSearch(left);
  const normalizedRight = normalizeInstituteSearch(right);
  if (!normalizedLeft || !normalizedRight) return false;
  return normalizedLeft === normalizedRight ||
    (Math.min(normalizedLeft.length, normalizedRight.length) >= 8 &&
      (normalizedLeft.includes(normalizedRight) || normalizedRight.includes(normalizedLeft)));
}

function getAccentByType(type = "") {
  const t = String(type).trim().toLowerCase();

  if (["government", "govt", "gov", "public"].some((label) => t.includes(label))) {
    return "from-[#b42117] to-[#9a2119]";
  }

  if (t.includes("private") || t === "pvt" || t.startsWith("pvt ")) {
    return "from-[#ff7b12] to-[#c84f15]";
  }

  return "from-gray-400 to-gray-500";
}

export default function InstitutePage() {
  const { goToDashboard, navigate, location } = usePortalNavigation();

  const [search, setSearch] = useState(() => {
    const params = new URLSearchParams(window.location.search);
    return params.get("search") || params.get("q") || "";
  });

  const [items, setItems] = useState(fallbackInstitutes);
  const [error, setError] = useState("");

  // Backend filters
  const [category, setCategory] = useState("");
  const [categories, setCategories] = useState([]);
  const [country, setCountry] = useState("");
  const [stateFilter, setStateFilter] = useState("");
  const [type, setType] = useState("");

  const [unlockModalItem, setUnlockModalItem] = useState(null);

  const [moduleMode, setModuleMode] = useState(
    location.state?.accessStatus || "preview"
  );

  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState(null);
  const [loading, setLoading] = useState(true);
  const [searchResult, setSearchResult] = useState(null);
  const [requestedInstituteId, setRequestedInstituteId] = useState(() =>
    new URLSearchParams(window.location.search).get("instituteId") || ""
  );

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const q = params.get("search") || params.get("q");
    setRequestedInstituteId(params.get("instituteId") || "");
    const selected = location.state?.searchItem;
    const selectedGroup = String(selected?.group || "").toLowerCase();
    const selectedType = String(selected?.type || "").toLowerCase();
    if (selected && (
      selectedGroup === "institutions" ||
      selectedGroup === "colleges" ||
      ["institution", "institute", "institutes", "college", "colleges"].includes(selectedType) ||
      params.has("instituteId")
    )) {
      setSearchResult({
        id: String(selected.id ?? selected.navigation?.id ?? params.get("instituteId") ?? selected.title),
        name: selected.title || selected.name || "Unnamed Institute",
        location: selected.subtitle || selected.location || "Location not available",
        city: selected.city || "",
        state: selected.state || "",
        country: selected.country || "",
        type: selected.badge || selected.institute_type || "Institute",
        logo: selected.image || selected.logo || null,
        website: selected.url || selected.website || selected.website_url || selected.official_website || selected.officialWebsite || selected.institute_website || selected.instituteWebsite || selected.college_website || selected.collegeWebsite || selected.web_url || selected.website_link || selected.navigation?.url || "",
        createdAt: null,
      });
    }
    if (q !== null && q !== undefined) {
      setSearch(q);
    }
  }, [location.search, location.state]);

  // Search-index results can omit the website even when the directory record
  // has it. Resolve the selected institute against the directory API by name
  // and merge the canonical website into the selected card.
  useEffect(() => {
    const selected = location.state?.searchItem;
    if (!selected) return;
    let active = true;
    async function loadDirectoryMatch() {
      try {
        const response = await getInstitutes({ search: selected.title || selected.name || "", limit: 50 });
        if (!active) return;
        const directoryItem = response.items.find((item) =>
          sameInstituteName(item.name, selected.title || selected.name || "")
        );
        if (!directoryItem) return;
        setSearchResult((current) => current ? {
          ...directoryItem,
          ...current,
          url: directoryItem.url || current.url || current.website || current.navigation?.url || "",
          website: directoryItem.website || current.website || current.url || current.navigation?.url || "",
        } : current);
      } catch (err) {
        console.error("Failed to resolve institute website:", err);
      }
    }
    loadDirectoryMatch();
    return () => { active = false; };
  }, [location.state]);

  // Global search results can point to institutes on any of the 505 pages.
  // Resolve the query through the same search index and add its match even
  // when the current paginated API page does not contain that institute.
  useEffect(() => {
    if (location.state?.searchItem) return;
    setSearchResult(null);
    if (!search.trim()) return;
    let active = true;

    async function loadSelectedInstitute() {
      try {
        const response = await globalSearch({
          query: search,
          type: "institutions",
          limit: 50,
        });
        if (!active) return;

        const results = Array.isArray(response?.results)
          ? response.results
          : Object.values(response?.grouped || {}).flat();
        const normalizedSearch = normalizeInstituteSearch(search);
        const selected = results.find((result) => {
          const resultId = result?.id ?? result?.navigation?.id;
          const resultTitle = normalizeInstituteSearch(result?.title || result?.name || "");
          return (requestedInstituteId && String(resultId ?? "") === String(requestedInstituteId)) ||
            resultTitle === normalizedSearch ||
            resultTitle.includes(normalizedSearch);
        });
        if (!selected) return;

        const selectedId = String(selected.id ?? selected.navigation?.id ?? requestedInstituteId ?? selected.title);
        setSearchResult((current) => {
          if (current && String(current.id) === selectedId) return current;
          return {
            id: selectedId,
            name: selected.title || selected.name || "Unnamed Institute",
            location: selected.subtitle || selected.location || "Location not available",
            city: selected.city || "",
            state: selected.state || "",
            country: selected.country || "",
            type: selected.badge || selected.institute_type || "Institute",
            logo: selected.image || selected.logo || null,
            website: selected.url || selected.website || selected.website_url || selected.official_website || selected.officialWebsite || selected.institute_website || selected.instituteWebsite || selected.college_website || selected.collegeWebsite || selected.web_url || selected.website_link || "",
            createdAt: null,
          };
        });
      } catch (err) {
        console.error("Failed to resolve selected institute:", err);
      }
    }

    loadSelectedInstitute();
    return () => { active = false; };
  }, [requestedInstituteId, search, location.state]);

  /*
   * ============================================================
   * LOAD CATEGORIES (ALL DOMAINS)
   * ============================================================
   */
  useEffect(() => {
    let active = true;

    async function loadCategories() {
      try {
        const response = await getCategories();
        if (!active) return;

        const categoryList = Array.isArray(response)
          ? response
          : Array.isArray(response?.data)
          ? response.data
          : [];

        setCategories(categoryList);
      } catch (err) {
        console.error("Failed to load categories:", err);
        if (active) {
          setCategories([]);
        }
      }
    }

    loadCategories();

    return () => {
      active = false;
    };
  }, []);

  /*
   * ============================================================
   * LOAD INSTITUTES
   * Category + Country + State + Type are now sent to backend.
   * Backend will filter first and then paginate.
   * ============================================================
   */
  useEffect(() => {
    let active = true;

    async function loadInstitutes() {
      try {
        setLoading(true);
        setError("");

        const response = await getInstitutes({
          page,
          limit: 30,
          category,
          country,
          state: stateFilter,
          type,
        });

        if (!active) return;

        setItems(response?.items || []);
        setPagination(response?.pagination || null);
      } catch (loadError) {
        if (active) {
          setError(
            loadError?.response?.data?.message ||
              loadError?.message ||
              "Failed to load institutes."
          );
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    }

    loadInstitutes();

    return () => {
      active = false;
    };
  }, [page, category, country, stateFilter, type]);

  /*
   * ============================================================
   * COUNTRY CHANGE
   * ============================================================
   */
  useEffect(() => {
    setStateFilter("");
    setPage(1);
  }, [country]);

  /*
   * ============================================================
   * CATEGORY OPTIONS (ALL DOMAINS)
   * ============================================================
   */
  const categoryOptions = useMemo(() => {
    return categories.map((cat) => ({
      value: cat.title || cat.name || String(cat.id),
      label: cat.title || cat.name || String(cat.id),
    }));
  }, [categories]);

  /*
   * ============================================================
   * CATEGORY CHANGE
   * ============================================================
   */
  function handleCategoryChange(value) {
    setCategory(value);
    setPage(1);
  }

  /*
   * ============================================================
   * FRONTEND FILTER
   *
   * IMPORTANT:
   * Category / Country / State / Type are already filtered by backend.
   * Search filter remains frontend filter.
   * ============================================================
   */
  const filtered = useMemo(
    () => {
      const matchingDirectoryItem = searchResult
        ? items.find((item) => sameInstituteName(item.name, searchResult.name))
        : null;
      const selectedInstitute = matchingDirectoryItem
        ? { ...searchResult, ...matchingDirectoryItem,
            url: matchingDirectoryItem.url || searchResult.url || searchResult.website,
            website: matchingDirectoryItem.website || searchResult.website || searchResult.url,
          }
        : searchResult;
      // A clicked global-search result is the user's exact selection. Keep it
      // visible directly; filtering that synthetic card again can discard it
      // when the backend's title/query formatting differs slightly.
      return (selectedInstitute ? [
        ...items.filter((item) =>
          String(item.id) !== String(selectedInstitute.id) &&
          !sameInstituteName(item.name, selectedInstitute.name)
        ),
        selectedInstitute,
      ] : items)
        .filter((item) => {
          if (selectedInstitute && String(item.id) === String(selectedInstitute.id)) return true;
          const instituteType =
            item.type || item.institute_type || "";

          const normalizedSearch = normalizeInstituteSearch(search);
          const matchesSearch =
            !normalizedSearch ||
            normalizeInstituteSearch(item.name).includes(normalizedSearch) ||
            normalizeInstituteSearch(item.location).includes(normalizedSearch) ||
            normalizeInstituteSearch(instituteType).includes(normalizedSearch);

          return matchesSearch;
        })
        .sort((a, b) => {
          if (selectedInstitute) {
            if (String(a.id) === String(selectedInstitute.id)) return -1;
            if (String(b.id) === String(selectedInstitute.id)) return 1;
          }
          if (a.createdAt && b.createdAt) {
            return (
              new Date(b.createdAt) -
              new Date(a.createdAt)
            );
          }

          return Number(b.id) - Number(a.id);
        });
    },
    [items, search, searchResult]
  );

  /*
   * ============================================================
   * COUNTRY OPTIONS
   *
   * Currently your data is India.
   * Keep country value lowercase because backend data is "india".
   * ============================================================
   */
  const countryOptions = useMemo(() => {
    const list = [
      ...new Set(
        items
          .map(
            (item) =>
              item.country || item.countruy || ""
          )
          .filter(Boolean)
      ),
    ];

    return list;
  }, [items]);

  /*
   * ============================================================
   * STATE OPTIONS
   *
   * For India use country-state-city package.
   * Values remain normal format:
   *
   * Odisha
   * Karnataka
   * Punjab
   * Maharashtra
   * ============================================================
   */
  const stateOptions = useMemo(() => {
    if (!country) return [];

    if (country.toLowerCase() === "india") {
      return State.getStatesOfCountry("IN").map((s) => ({
        value: s.name,
        label: s.name,
      }));
    }

    /*
     * Other countries:
     * If required later, states can be taken from API data.
     */
    const states = items
      .filter((item) => {
        const itemCountry =
          item.country || item.countruy || "";

        return (
          itemCountry.toLowerCase() ===
          country.toLowerCase()
        );
      })
      .map((item) => item.state)
      .filter(Boolean);

    return [...new Set(states)].map((s) => ({
      value: s,
      label: s,
    }));
  }, [items, country]);

  /*
   * ============================================================
   * TYPE OPTIONS
   *
   * Government / Private
   *
   * We keep static values so that after selecting Government,
   * Private does not disappear from dropdown just because the
   * current API response contains only Government records.
   * ============================================================
   */
  const typeOptions = [
    {
      value: "Government",
      label: "Government",
    },
    {
      value: "Private",
      label: "Private",
    },
  ];

  /*
   * ============================================================
   * HANDLE COUNTRY
   * ============================================================
   */
  function handleCountryChange(value) {
    setCountry(value?.toLowerCase() || "");
    setStateFilter("");
    setPage(1);
  }

  /*
   * ============================================================
   * HANDLE STATE
   * ============================================================
   */
  function handleStateChange(value) {
    setStateFilter(value || "");
    setPage(1);
  }

  /*
   * ============================================================
   * HANDLE TYPE
   * ============================================================
   */
  function handleTypeChange(value) {
    setType(value || "");
    setPage(1);
  }

  /*
   * ============================================================
   * CLEAR ALL FILTERS
   * ============================================================
   */
  function handleClearFilters() {
    setCategory("");
    setCountry("");
    setStateFilter("");
    setType("");
    setSearch("");
    setSearchResult(null);
    setRequestedInstituteId("");
    setPage(1);
    // Global-search selections live in both the query string and router state.
    // Remove them too, or the selected institute is re-added after clearing.
    navigate("/app/institutes", {
      replace: true,
      state: { accessStatus: moduleMode },
    });
  }

  return (
    <ModuleScreen className="space-y-5">
      {error ? (
        <Alert
          type="warning"
          title={error}
          showIcon
          style={{ borderRadius: 16 }}
        />
      ) : null}

      {/* ========================================================
          HEADER
      ======================================================== */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold">
            Institutions
          </h1>
        </div>

        <div className="flex items-center gap-3">
          <span className="rounded-full bg-[#fdf0ee] px-3 py-1 text-xs text-[#9a2119]">
            {pagination?.total ?? filtered.length}
          </span>

          <PageHero
            backOnly
            onBack={() => navigate(location.state?.fromGlobalSearch ? (location.state.returnTo || "/app/dashboard") : "/app/dashboard")}
            className="shrink-0"
          />
        </div>
      </div>

      {/* ========================================================
          FILTERS
      ======================================================== */}
      <div className="flex flex-wrap items-center gap-2">
        {/* DOMAIN / CATEGORY */}
        <div className="relative">
          <Select
            showSearch
            allowClear
            placeholder="All Domain"
            optionFilterProp="label"
            value={category || undefined}
            onChange={(value) =>
              handleCategoryChange(value || "")
            }
            options={categoryOptions}
            style={{ minWidth: 180 }}
            className="pill-select"
          />
        </div>

        {/* COUNTRY */}
        <div className="relative">
          <Select
            showSearch
            allowClear
            placeholder="All Countries"
            optionFilterProp="label"
            value={country || undefined}
            onChange={handleCountryChange}
            options={countryOptions.map((c) => ({
              value: c.toLowerCase(),
              label:
                c.charAt(0).toUpperCase() +
                c.slice(1),
            }))}
            style={{ minWidth: 160 }}
            className="pill-select"
          />
        </div>

        {/* STATE */}
        <Select
          showSearch
          allowClear
          placeholder="All States"
          filterOption={(input, option) =>
            (option?.label ?? "")
              .toLowerCase()
              .includes(input.toLowerCase())
          }
          value={stateFilter || undefined}
          onChange={handleStateChange}
          options={stateOptions}
          disabled={!country}
          style={{ minWidth: 160 }}
          className="pill-select"
        />

        {/* TYPE */}
        <div className="relative">
          <Select
            showSearch
            allowClear
            placeholder="All Types"
            optionFilterProp="label"
            value={type || undefined}
            onChange={handleTypeChange}
            options={typeOptions}
            style={{ minWidth: 160 }}
            className="pill-select"
          />
        </div>

        {/* CLEAR */}
        {(
          category ||
          country ||
          stateFilter ||
          type ||
          search
        ) ? (
          <button
            type="button"
            onClick={handleClearFilters}
            className="rounded-full px-2.5 py-1.5 text-[12px] font-semibold text-[#9a2119] underline-offset-2 hover:underline"
          >
            Clear
          </button>
        ) : null}
      </div>

      {/* ========================================================
          LOADING
      ======================================================== */}
      {loading && (
        <div className="py-6 text-center text-sm text-gray-500">
          Loading institutes...
        </div>
      )}

      {/* ========================================================
          INSTITUTION CARDS
      ======================================================== */}
      <div className="content-stagger grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
        {!loading &&
          filtered.map((item, index) => {
            const instituteType =
              item.type ||
              item.institute_type ||
              "";

            const accent =
              getAccentByType(instituteType);

            const initials = getInitials(item.name);

            const websiteUrl =
              item.url || item.website || item.website_url || item.official_website || item.officialWebsite || item.institute_website || item.instituteWebsite || item.college_website || item.collegeWebsite || item.web_url || item.website_link;
            const hasWebsite = Boolean(websiteUrl && websiteUrl !== "#");

            const isPreviewMode =
              moduleMode === "preview";

            const isFree =
              !isPreviewMode || index < 4;

            return (
              <div
                key={item.id || item.name}
                onClick={() => {
                  if (!isFree) {
                    setUnlockModalItem(item.name);
                  }
                }}
                className="group cursor-pointer overflow-hidden rounded-[28px] border border-[#e8dfda] bg-white shadow-sm transition-all duration-300 hover:-translate-y-1 hover:border-[#d7c3bc] hover:shadow-xl"
              >
                {/* CARD HEADER */}
                <div
                  className={`h-24 bg-gradient-to-r ${accent} p-5`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="rounded-full bg-white/18 px-3 py-1 text-[11px] font-bold uppercase tracking-[0.22em] text-white/90">
                      {instituteType}
                    </div>

                    <div
                      className={`flex h-9 w-9 items-center justify-center rounded-full ${
                        isFree
                          ? "bg-green-50"
                          : "bg-red-50"
                      }`}
                    >
                      {isFree ? (
                        <UnlockOutlined className="text-green-600" />
                      ) : (
                        <LockOutlined className="text-red-500" />
                      )}
                    </div>
                  </div>
                </div>

                {/* CARD BODY */}
                <div className="relative px-5 pb-5 pt-0">
                  {/* LOGO */}
                  <div
                    className={`-mt-8 flex h-[64px] w-[64px] items-center justify-center rounded-[20px] border-4 border-white bg-gradient-to-br ${accent} text-[20px] font-black text-white shadow-md`}
                  >
                    {item.logo ? (
                      <img
                        src={item.logo}
                        alt={item.name}
                        className="h-full w-full rounded-[16px] object-cover"
                        loading="lazy"
                      />
                    ) : (
                      initials
                    )}
                  </div>

                  {/* NAME + LOCATION */}
                  <div className="mt-4">
                    <h3 className="line-clamp-3 text-[20px] font-black leading-tight text-[#241d1e]">
                      {item.name}
                    </h3>

                    <p className="mt-3 flex min-h-[44px] items-start gap-2 text-[14px] leading-6 text-[#746d73]">
                      <EnvironmentOutlined className="mt-1 text-[13px] text-[#9a2119]" />

                      <span>
                        {item.location ||
                          [item.city, item.state]
                            .filter(Boolean)
                            .join(", ") ||
                          "Location not available"}
                      </span>
                    </p>
                  </div>

                  {/* FOOTER */}
                  <div className="mt-5 flex items-center justify-between border-t border-[#efe3de] pt-4">
                    <span className="text-[12px] font-semibold uppercase tracking-[0.18em] text-[#aa8a83]">
                      {item.state || ""}
                    </span>

                    {hasWebsite ? (
                      <a
                        href={/^https?:\/\//i.test(websiteUrl) ? websiteUrl : `https://${websiteUrl}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={(e) => {
                          e.stopPropagation();

                          if (!isFree) {
                            e.preventDefault();
                            setUnlockModalItem(
                              item.name
                            );
                          }
                        }}
                        className="flex items-center gap-2 text-[14px] font-bold text-[#b22b1f]"
                      >
                        Explore <RightOutlined />
                      </a>
                    ) : (
                      <span>No Website</span>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
      </div>

      {/* ========================================================
          NO DATA
      ======================================================== */}
      {!loading && filtered.length === 0 && (
        <div className="py-10 text-center text-sm text-gray-500">
          No institutes found.
        </div>
      )}

      {/* ========================================================
          PAGINATION
      ======================================================== */}
      {pagination &&
        pagination.totalPages > 1 && (
          <div className="flex items-center justify-center gap-3 py-6">
            <Button
              disabled={
                !pagination.hasPreviousPage ||
                loading
              }
              onClick={() =>
                setPage((prev) =>
                  Math.max(prev - 1, 1)
                )
              }
            >
              <span className="inline-flex items-center gap-1"><LeftOutlined /> Previous</span>
            </Button>

            <span className="text-sm font-semibold">
              Page {pagination.page} of{" "}
              {pagination.totalPages}
            </span>

            <Button
              disabled={
                !pagination.hasNextPage ||
                loading
              }
              onClick={() =>
                setPage((prev) => prev + 1)
              }
            >
              <span className="inline-flex items-center gap-1">Next <RightOutlined /></span>
            </Button>
          </div>
        )}

      {/* ========================================================
          UNLOCK MODAL
      ======================================================== */}
      <UnlockRedirectModal
        open={Boolean(unlockModalItem)}
        title="Unlock Institute"
        itemLabel={unlockModalItem}
        description="Your free institute access has already been used. Subscribe to unlock "
        onCancel={() =>
          setUnlockModalItem(null)
        }
        onConfirm={() => {
          setUnlockModalItem(null);

          navigate(
            `/app/subscription?returnTo=${encodeURIComponent(
              location.pathname
            )}`
          );
        }}
      />
    </ModuleScreen>
  );
}

