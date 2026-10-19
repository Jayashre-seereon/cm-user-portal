import api from "./axios";

function buildLocation(city, state) {
  return (
    [city, state].filter(Boolean).join(", ") ||
    "Location not available"
  );
}

function stripHtml(value) {
  if (!value) {
    return "";
  }

  return String(value)
    .replace(/<[^>]*>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function formatDateDDMMYYYY(value) {
  if (!value) {
    return "";
  }

  const parsedDate = new Date(value);

  if (Number.isNaN(parsedDate.getTime())) {
    return String(value);
  }

  return parsedDate.toLocaleDateString("en-GB");
}

function mapInstituteItem(item, index) {
  const state =
    item?.state?.trim() || "";

  const country =
    (item?.country || item?.countruy || "")
      .trim()
      .toLowerCase();

  const city =
    item?.city?.trim() || "";

  const instituteType =
    item?.institute_type?.trim() ||
    "Institute";

  const courses = Array.isArray(
    item?.course_offered
  )
    ? item.course_offered.filter(Boolean)
    : [];

  return {
    id: String(
      item?.id ?? `institute-${index}`
    ),

    createdAt:
      item?.createdAt ||
      item?.created_at ||
      null,

    name:
      item?.name ||
      "Unnamed Institute",

    location:
      item?.address ||
      buildLocation(city, state),

    city,
    country,
    state,

    type: instituteType,

    courses,

    about:
      stripHtml(item?.about) ||
      "About information is not available right now.",

    website:
      item?.url || "#",

    rank:
      item?.rank || "Top",

    logo:
      item?.logo || null,

    tentativeDate:
      formatDateDDMMYYYY(
        item?.tentative_date ||
        item?.tentativeDate ||
        ""
      ),

    category:
      item?.category || null,

    secondcategory:
      item?.secondcategory || null,

    subcategory:
      item?.subcategory || null,
  };
}


/*
|--------------------------------------------------------------------------
| Get Institutes - Paginated + Filters
|--------------------------------------------------------------------------
|
| Example:
|
| getInstitutes({
|   page: 1,
|   limit: 30,
|   category: "Engineering",
|   country: "India",
|   state: "Delhi",
|   type: "Private"
| })
|
*/
export async function getInstitutes({
  page = 1,
  limit = 30,
  category = "",
  country = "",
  state = "",
  type = "",
} = {}) {
  const params = new URLSearchParams();

  if (page) params.append("page", page);
  if (limit) params.append("limit", limit);

  if (category && category !== "all") {
    params.append("category", category);
  }

  if (country && country !== "all") {
    params.append("country", country);
  }

  if (state && state !== "all") {
    params.append("state", state);
  }

  if (type && type !== "all") {
    params.append("type", type);
  }

  const response = await api.get(
    `/institutes/paginated?${params.toString()}`
  );

  const items = Array.isArray(response?.data?.data)
    ? response.data.data
    : Array.isArray(response?.data?.items)
    ? response.data.items
    : Array.isArray(response?.data)
    ? response.data
    : [];

  return {
    items: items.map((item, index) =>
      mapInstituteItem(item, index)
    ),

    pagination:
      response?.data?.pagination || {
        page,
        limit,
        total: items.length,
        totalPages: 1,
        hasNextPage: false,
        hasPreviousPage: false,
      },
  };
}

export const fetchInstitutions = getInstitutes;

export const getCategories = async () => {
  const res = await api.get("/categories/");
  return res.data;
};