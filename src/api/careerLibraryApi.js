import api from "./axios";
function buildPreviewHeaders(moduleId, previewSessionId) {
  const headers = {};

  if (moduleId) {
    headers["x-module-id"] = moduleId;
  }

  if (previewSessionId) {
    headers["x-preview-session"] = previewSessionId;
  }

  return headers;
}
export async function getCareerLibraryCategories() {
  const response = await api.get("/careerlibrary/categories");
  return response?.data ?? null;
}

export async function getCareerLibraryStreams() {
  const response = await api.get("/streams/");
  return response?.data ?? null;
}

export async function getCareerLibraryCategoriesByStream(
  streamId,
  moduleId
) {
  console.log("getCareerLibraryCategoriesByStream called");
  console.log("streamId =", streamId);
  console.log("moduleId =", moduleId);

  const response = await api.get(`/categories/stream/${streamId}`, {
    headers: {
      "x-module-id": moduleId,
    },
  });

  return response.data;
}

export async function getCareerLibraryNext(
  type,
  id,
  moduleId,
  previewSessionId
) {
  const response = await api.get(
    `/careerlibrary/next/${type}/${id}`,
    {
      headers: buildPreviewHeaders(
        moduleId,
        previewSessionId
      ),
    }
  );

  return response?.data ?? null;
}

export async function getCareerLibraryDetails(
  subcategoryId,
  moduleId,
  previewSessionId
) {
  const response = await api.get(
    `/careerlibrary/subcategory/${subcategoryId}/details`,
    {
      headers: buildPreviewHeaders(
        moduleId,
        previewSessionId
      ),
    }
  );

  return response?.data ?? null;
}
