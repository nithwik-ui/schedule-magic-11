const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

async function getSessionAndCsrf(): Promise<{ cookies: string[]; csrfToken: string }> {
  const pageRes = await fetch("https://timetable.sruniv.com/batchReport", {
    headers: { "User-Agent": "Mozilla/5.0" },
  });

  const cookieJar: string[] = [];
  for (const [key, val] of pageRes.headers.entries()) {
    if (key === "set-cookie") {
      cookieJar.push(val.split(";")[0]);
    }
  }

  const html = await pageRes.text();
  let csrfToken = "";
  const metaMatch = html.match(/<meta\s+name="csrf-token"\s+content="([^"]+)"/);
  if (metaMatch) {
    csrfToken = metaMatch[1];
  } else {
    const inputMatch = html.match(/<input[^>]+name="_token"[^>]+value="([^"]+)"/);
    if (inputMatch) csrfToken = inputMatch[1];
  }

  return { cookies: cookieJar, csrfToken };
}

interface BatchRecord {
  id: number;
  degree: string;
  year: string;
  batch: string;
  semester: string;
  school_dept: string;
  session: string;
  group_name: string | null;
  sub_batch: string | null;
  status: string;
}

async function fetchWithPost(url: string, formData: URLSearchParams, cookies: string[]): Promise<any> {
  const res = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      "Cookie": cookies.join("; "),
      "User-Agent": "Mozilla/5.0",
      "X-Requested-With": "XMLHttpRequest",
      "Accept": "application/json",
      "Referer": "https://timetable.sruniv.com/batchReport",
    },
    body: formData.toString(),
  });
  if (!res.ok) return null;
  return await res.json();
}

async function fetchWithGet(url: string, cookies: string[]): Promise<any> {
  const res = await fetch(url, {
    headers: {
      "Cookie": cookies.join("; "),
      "User-Agent": "Mozilla/5.0",
      "X-Requested-With": "XMLHttpRequest",
      "Accept": "application/json",
    },
  });
  if (!res.ok) return null;
  return await res.json();
}

function extractRecords(data: any): BatchRecord[] {
  if (!data) return [];
  
  // Handle {"yearList": [...]} or {"batchList": [...]} or direct array
  const possibleKeys = ["yearList", "batchList", "data", "list"];
  
  for (const key of possibleKeys) {
    if (data[key] && Array.isArray(data[key])) {
      return data[key];
    }
  }
  
  if (Array.isArray(data)) {
    if (data.length > 0 && Array.isArray(data[0])) return data[0];
    if (data.length > 0 && typeof data[0] === "object") return data;
  }
  
  // Try all object values
  if (typeof data === "object") {
    for (const val of Object.values(data)) {
      if (Array.isArray(val) && val.length > 0 && typeof val[0] === "object") {
        return val as BatchRecord[];
      }
    }
  }
  
  return [];
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { action, degree, year } = await req.json();

    if (!action || !degree) {
      return new Response(
        JSON.stringify({ success: false, error: "Missing action or degree" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const { cookies, csrfToken } = await getSessionAndCsrf();
    console.log(`Action: ${action}, Degree: ${degree}, Year: ${year || "N/A"}, CSRF: ${csrfToken ? "yes" : "no"}`);

    if (action === "getYears") {
      // Try multiple approaches to get years
      let records: BatchRecord[] = [];

      // Approach 1: GET /get-yearbpublic
      const getData = await fetchWithGet(
        `https://timetable.sruniv.com/get-yearbpublic?degree=${encodeURIComponent(degree)}`,
        cookies
      );
      records = extractRecords(getData);
      console.log(`GET years: ${records.length} records`);

      // Approach 2: POST with CSRF if GET didn't work well
      if (records.length === 0) {
        const formData = new URLSearchParams();
        formData.append("_token", csrfToken);
        formData.append("degree", degree);
        
        for (const endpoint of [
          "https://timetable.sruniv.com/getYearByDegreePublic",
          "https://timetable.sruniv.com/get-yearbpublic",
        ]) {
          const postData = await fetchWithPost(endpoint, formData, cookies);
          records = extractRecords(postData);
          if (records.length > 0) break;
        }
      }

      const yearOrder: Record<string, number> = { "First": 1, "Second": 2, "Third": 3, "Fourth": 4, "Fifth": 5 };
      const uniqueYears = [...new Set(records.map(r => r.year))].sort(
        (a, b) => (yearOrder[a] || 99) - (yearOrder[b] || 99)
      );

      return new Response(
        JSON.stringify({ success: true, options: uniqueYears }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (action === "getBatches") {
      if (!year) {
        return new Response(
          JSON.stringify({ success: false, error: "Missing year" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      let batches: string[] = [];

      // Approach 1: POST with CSRF to various batch endpoints
      const formData = new URLSearchParams();
      formData.append("_token", csrfToken);
      formData.append("degree", degree);
      formData.append("year", year);

      const postEndpoints = [
        "https://timetable.sruniv.com/getBatchByYearPublic",
        "https://timetable.sruniv.com/get-batchbpublic",
      ];

      for (const endpoint of postEndpoints) {
        try {
          const postData = await fetchWithPost(endpoint, formData, cookies);
          console.log(`POST ${endpoint} response:`, JSON.stringify(postData)?.substring(0, 300));
          const records = extractRecords(postData);
          if (records.length > 0) {
            if (typeof records[0] === "string") {
              batches = records as unknown as string[];
            } else if (records[0].batch) {
              batches = [...new Set(records.map(r => r.batch))];
            }
          } else if (postData && Array.isArray(postData)) {
            // Could be direct array of strings
            if (postData.length > 0 && typeof postData[0] === "string") {
              batches = postData;
            }
          }
          if (batches.length > 0) {
            console.log(`Found ${batches.length} batches from POST ${endpoint}`);
            break;
          }
        } catch (e) {
          console.log(`POST ${endpoint} failed:`, e);
        }
      }

      // Approach 2: GET with query params
      if (batches.length === 0) {
        const getEndpoints = [
          `https://timetable.sruniv.com/get-batchbpublic?degree=${encodeURIComponent(degree)}&year=${encodeURIComponent(year)}`,
        ];

        for (const url of getEndpoints) {
          try {
            const getData = await fetchWithGet(url, cookies);
            console.log(`GET batch response:`, JSON.stringify(getData)?.substring(0, 300));
            const records = extractRecords(getData);
            if (records.length > 0) {
              batches = [...new Set(records.map(r => r.batch))];
            }
            if (batches.length > 0) break;
          } catch (e) {
            console.log(`GET batch failed:`, e);
          }
        }
      }

      // Approach 3: Fallback - get all records for degree and filter by year
      if (batches.length === 0) {
        const allData = await fetchWithGet(
          `https://timetable.sruniv.com/get-yearbpublic?degree=${encodeURIComponent(degree)}`,
          cookies
        );
        const allRecords = extractRecords(allData);
        const filtered = allRecords.filter(r => r.year === year);
        batches = [...new Set(filtered.map(r => r.batch))];
        console.log(`Fallback: ${batches.length} batches from yearList filtered by ${year}`);
      }

      batches.sort();

      return new Response(
        JSON.stringify({ success: true, options: batches }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    return new Response(
      JSON.stringify({ success: false, error: "Unknown action" }),
      { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error:", error);
    return new Response(
      JSON.stringify({ success: false, error: "Internal error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
