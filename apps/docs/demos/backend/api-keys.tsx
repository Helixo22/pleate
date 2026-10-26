"use client";

import { ApiKeyList } from "pleate/api-key-list";
import { useApiKeys } from "pleate-client/react";

export default function ApiKeysDemo() {
  const apiKeys = useApiKeys();
  return <ApiKeyList {...apiKeys.apiKeyListProps} className="w-full" />;
}
