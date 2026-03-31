import { useState, useEffect, ReactNode } from "react";
import { User } from "@workspace/api-client-react";

export function getAuthToken() {
  return localStorage.getItem("distrimed_token");
}

export function setAuthToken(token: string) {
  localStorage.setItem("distrimed_token", token);
}

export function clearAuth() {
  localStorage.removeItem("distrimed_token");
  localStorage.removeItem("distrimed_user");
}

export function setAuthUser(user: User) {
  localStorage.setItem("distrimed_user", JSON.stringify(user));
}

export function getAuthUser(): User | null {
  const data = localStorage.getItem("distrimed_user");
  if (!data) return null;
  try {
    return JSON.parse(data) as User;
  } catch {
    return null;
  }
}
