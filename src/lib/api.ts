import { User, LoginResponse, RegisterPayload } from "@/types/auth";
import { Land, LandCreatePayload, Crop, CropOnLand, VegetationIndexSet, CropCreatePayload, CropUpdatePayload } from "@/types/farm";
import { AlertScenario, AlertScenarioCreatePayload, AlertScenarioUpdatePayload, AlertNotification } from "@/types/alert";

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000";

const TOKEN_KEY = "agrisat_access_token";

export const getToken = (): string | null => {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(TOKEN_KEY);
};

export const setToken = (token: string): void => {
  if (typeof window === "undefined") return;
  localStorage.setItem(TOKEN_KEY, token);
};

export const removeToken = (): void => {
  if (typeof window === "undefined") return;
  localStorage.removeItem(TOKEN_KEY);
};

// --- Auth Endpoints ---

export async function loginApi(
  email: string,
  password: string
): Promise<LoginResponse> {
  const params = new URLSearchParams();
  params.append("username", email);
  params.append("password", password);

  const response = await fetch(`${API_BASE_URL}/api/v1/auth/login`, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: params.toString(),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    const message =
      typeof errorData.detail === "string"
        ? errorData.detail
        : "Invalid login credentials. Please check your email and password.";
    throw new Error(message);
  }

  return response.json();
}

export async function registerApi(payload: RegisterPayload): Promise<User> {
  const response = await fetch(`${API_BASE_URL}/api/v1/auth/register`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    let message = "Registration failed. Please verify your details.";
    if (typeof errorData.detail === "string") {
      message = errorData.detail;
    } else if (Array.isArray(errorData.detail)) {
      message = errorData.detail.map((d: { msg?: string }) => d.msg).join(", ");
    }
    throw new Error(message);
  }

  return response.json();
}

export async function getCurrentUserApi(token: string): Promise<User> {
  const response = await fetch(`${API_BASE_URL}/api/v1/auth/me`, {
    method: "GET",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
  });

  if (!response.ok) {
    throw new Error("Session expired or invalid token.");
  }

  return response.json();
}

// --- Farm & Land Endpoints ---

export async function getLandsApi(token: string): Promise<Land[]> {
  const response = await fetch(`${API_BASE_URL}/api/v1/farms/lands`, {
    method: "GET",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
  });

  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(err.detail || "Failed to load user lands.");
  }

  return response.json();
}

export async function getLandByIdApi(token: string, landId: number): Promise<Land> {
  const response = await fetch(`${API_BASE_URL}/api/v1/farms/lands/${landId}`, {
    method: "GET",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
  });

  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(err.detail || `Failed to fetch land #${landId}.`);
  }

  return response.json();
}

export async function createLandApi(
  token: string,
  payload: LandCreatePayload
): Promise<Land> {
  const response = await fetch(`${API_BASE_URL}/api/v1/farms/lands`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    let msg = "Failed to create land boundary.";
    if (typeof err.detail === "string") {
      msg = err.detail;
    } else if (Array.isArray(err.detail)) {
      msg = err.detail.map((d: any) => d.msg).join(", ");
    }
    throw new Error(msg);
  }

  return response.json();
}

export async function getReferenceCropsApi(): Promise<Crop[]> {
  const response = await fetch(`${API_BASE_URL}/api/v1/farms/crops`, {
    method: "GET",
  });

  if (!response.ok) {
    return [];
  }

  return response.json();
}

export async function getLandCropsApi(token: string, landId: number): Promise<CropOnLand[]> {
  const response = await fetch(`${API_BASE_URL}/api/v1/farms/lands/${landId}/crops`, {
    method: "GET",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
  });

  if (!response.ok) {
    return [];
  }

  return response.json();
}

export async function plantCropOnLandApi(
  token: string,
  landId: number,
  payload: CropCreatePayload
): Promise<any> {
  const response = await fetch(`${API_BASE_URL}/api/v1/farms/lands/${landId}/crops`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(err.detail || "Failed to plant crop on land.");
  }

  return response.json();
}

export async function updateLandApi(
  token: string,
  landId: number,
  payload: Partial<LandCreatePayload>
): Promise<Land> {
  const response = await fetch(`${API_BASE_URL}/api/v1/farms/lands/${landId}`, {
    method: "PUT",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    let msg = "Failed to update land details.";
    if (typeof err.detail === "string") {
      msg = err.detail;
    } else if (Array.isArray(err.detail)) {
      msg = err.detail.map((d: any) => d.msg).join(", ");
    }
    throw new Error(msg);
  }

  return response.json();
}

export async function getLandSatelliteDataApi(
  token: string,
  landId: number,
  params?: {
    satellite_name?: string;
    acquisition_date?: string;
    skip?: number;
    limit?: number;
  }
): Promise<VegetationIndexSet[]> {
  const url = new URL(`${API_BASE_URL}/api/v1/farms/lands/${landId}/satellite-data`);
  if (params?.satellite_name) url.searchParams.set("satellite_name", params.satellite_name);
  if (params?.acquisition_date) url.searchParams.set("acquisition_date", params.acquisition_date);
  if (params?.skip !== undefined) url.searchParams.set("skip", params.skip.toString());
  if (params?.limit !== undefined) url.searchParams.set("limit", params.limit.toString());

  const response = await fetch(url.toString(), {
    method: "GET",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
  });

  if (!response.ok) {
    return [];
  }

  return response.json();
}

// --- Alerts & Scenarios Endpoints ---

export async function createAlertScenarioApi(
  token: string,
  payload: AlertScenarioCreatePayload
): Promise<AlertScenario> {
  const response = await fetch(`${API_BASE_URL}/api/v1/alerts/scenarios`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    let msg = "Failed to create alert scenario.";
    if (typeof err.detail === "string") {
      msg = err.detail;
    } else if (Array.isArray(err.detail)) {
      msg = err.detail.map((d: any) => d.msg).join(", ");
    }
    throw new Error(msg);
  }

  return response.json();
}

export async function getAlertScenariosApi(
  token: string,
  landId: number
): Promise<AlertScenario[]> {
  const response = await fetch(`${API_BASE_URL}/api/v1/alerts/scenarios?land_id=${landId}`, {
    method: "GET",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
  });

  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(err.detail || "Failed to load alert scenarios.");
  }

  return response.json();
}

export async function getTriggeredAlertsApi(
  token: string,
  landId: number
): Promise<AlertNotification[]> {
  const response = await fetch(`${API_BASE_URL}/api/v1/alerts/?land_id=${landId}`, {
    method: "GET",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
  });

  if (!response.ok) {
    return [];
  }

  return response.json();
}

export async function deleteLandApi(
  token: string,
  landId: number
): Promise<void> {
  const response = await fetch(`${API_BASE_URL}/api/v1/farms/lands/${landId}`, {
    method: "DELETE",
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(err.detail || `Failed to delete land #${landId}.`);
  }
}

export async function updateCropOnLandApi(
  token: string,
  landId: number,
  payload: CropUpdatePayload
): Promise<CropOnLand> {
  const response = await fetch(`${API_BASE_URL}/api/v1/farms/lands/${landId}/crops`, {
    method: "PUT",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(err.detail || "Failed to update crop details.");
  }

  return response.json();
}

export async function deleteCropFromLandApi(
  token: string,
  landId: number,
  cropInstanceId: number
): Promise<void> {
  const response = await fetch(`${API_BASE_URL}/api/v1/farms/lands/${landId}/crops/${cropInstanceId}`, {
    method: "DELETE",
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(err.detail || "Failed to delete crop record.");
  }
}

export async function updateAlertScenarioApi(
  token: string,
  scenarioId: number,
  payload: AlertScenarioUpdatePayload
): Promise<AlertScenario> {
  const response = await fetch(`${API_BASE_URL}/api/v1/alerts/scenarios/${scenarioId}`, {
    method: "PUT",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(err.detail || "Failed to update alert scenario.");
  }

  return response.json();
}

export async function bulkUpdateAlertScenariosApi(
  token: string,
  landId: number,
  isActive: boolean
): Promise<AlertScenario[]> {
  const response = await fetch(`${API_BASE_URL}/api/v1/alerts/scenarios/bulk`, {
    method: "PUT",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ land_id: landId, is_active: isActive }),
  });

  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(err.detail || "Failed to update alert scenarios status.");
  }

  return response.json();
}

export async function deleteAlertScenarioApi(
  token: string,
  scenarioId: number
): Promise<void> {
  const response = await fetch(`${API_BASE_URL}/api/v1/alerts/scenarios/${scenarioId}`, {
    method: "DELETE",
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(err.detail || "Failed to delete alert scenario.");
  }
}

export { API_BASE_URL };
