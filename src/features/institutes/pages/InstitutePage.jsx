
import { useEffect, useMemo, useState } from "react";
import { Alert, Button, Select } from "antd";
import {
  EnvironmentOutlined,
  RightOutlined,
  LockOutlined,
  UnlockOutlined,
} from "@ant-design/icons";
import { State } from "country-state-city";

import { getInstitutes, getCategories } from "../../../api/instituteApi";
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

function getAccentByType(type = "") {
  const t = String(type).toLowerCase();

  if (t.includes("government")) {
    return "from-[#b42117] to-[#9a2119]";
  }

  if (t.includes("private")) {
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
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const q = params.get("search") || params.get("q");
    if (q !== null && q !== undefined) {
      setSearch(q);
    }
  }, [location.search]);

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
    () =>
      items
        .filter((item) => {
          const instituteType =
            item.type || item.institute_type || "";

          const matchesSearch =
            !search ||
            item.name
              ?.toLowerCase()
              .includes(search.toLowerCase()) ||
            item.location
              ?.toLowerCase()
              .includes(search.toLowerCase()) ||
            instituteType
              .toLowerCase()
              .includes(search.toLowerCase());

          return matchesSearch;
        })
        .sort((a, b) => {
          if (a.createdAt && b.createdAt) {
            return (
              new Date(b.createdAt) -
              new Date(a.createdAt)
            );
          }

          return Number(b.id) - Number(a.id);
        }),
    [items, search]
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
    setPage(1);
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
            onBack={goToDashboard}
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
              item.url || item.website;

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

                    {websiteUrl ? (
                      <a
                        href={websiteUrl}
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
              Previous
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
              Next
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

