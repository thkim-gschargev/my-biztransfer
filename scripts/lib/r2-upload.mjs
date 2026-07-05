/**
 * R2 업로드 공유 모듈 (S3 호환 API, SigV4).
 * 여러 보고서 생성기가 같은 자격증명으로 서로 다른 객체 키에 업로드한다.
 */
export async function uploadToR2(html, env, { key, cacheControl } = {}) {
  const objectKey = key || env.R2_OBJECT_KEY || "report.html";
  const cc = cacheControl || env.R2_CACHE_CONTROL || "no-cache";
  const endpoint =
    env.R2_ENDPOINT ||
    (env.R2_ACCOUNT_ID ? `https://${env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com` : "");

  const missing = [];
  if (!endpoint) missing.push("R2_ACCOUNT_ID (또는 R2_ENDPOINT)");
  if (!env.R2_BUCKET) missing.push("R2_BUCKET");
  if (!env.R2_ACCESS_KEY_ID) missing.push("R2_ACCESS_KEY_ID");
  if (!env.R2_SECRET_ACCESS_KEY) missing.push("R2_SECRET_ACCESS_KEY");
  if (missing.length) {
    console.error(
      `\n❌ R2 업로드 설정이 없습니다. .env.local 에 아래 값을 추가하세요:\n   - ${missing.join("\n   - ")}\n` +
        `   (Cloudflare 대시보드 → R2 → Manage R2 API Tokens 에서 S3 자격증명 발급)`,
    );
    process.exit(1);
  }

  const { AwsClient } = await import("aws4fetch");
  const aws = new AwsClient({
    accessKeyId: env.R2_ACCESS_KEY_ID,
    secretAccessKey: env.R2_SECRET_ACCESS_KEY,
    service: "s3",
    region: "auto",
  });

  const url = `${endpoint.replace(/\/$/, "")}/${env.R2_BUCKET}/${encodeURIComponent(objectKey)}`;
  const res = await aws.fetch(url, {
    method: "PUT",
    body: Buffer.from(html, "utf8"),
    headers: {
      "content-type": "text/html; charset=utf-8",
      "cache-control": cc,
    },
  });
  if (!res.ok) {
    throw new Error(`R2 업로드 실패 ${res.status} ${res.statusText}\n${await res.text()}`);
  }

  console.log(`☁️  R2 업로드 완료: ${env.R2_BUCKET}/${objectKey}  (cache-control: ${cc})`);
  if (env.R2_PUBLIC_BASE) {
    console.log(`   URL: ${env.R2_PUBLIC_BASE.replace(/\/$/, "")}/${encodeURIComponent(objectKey)}`);
  }
}
