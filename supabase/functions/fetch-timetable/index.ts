const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { degree, year, batch } = await req.json();

    if (!degree || !year || !batch) {
      return new Response(
        JSON.stringify({ success: false, error: "Missing parameters" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log(`Fetching timetable for ${degree}, Year ${year}, Batch ${batch}`);

    try {
      // Step 1: Get session cookie and CSRF token from the page
      const pageRes = await fetch("https://timetable.sruniv.com/batchReport", {
        headers: { "User-Agent": "Mozilla/5.0" },
      });

      const cookies = pageRes.headers.getSetHeader?.("set-cookie") || [];
      // Extract all cookies from set-cookie headers
      const cookieJar: string[] = [];
      const rawHeaders = pageRes.headers;
      // Deno doesn't support getSetCookie well, parse raw
      for (const [key, val] of rawHeaders.entries()) {
        if (key === "set-cookie") {
          const cookiePart = val.split(";")[0];
          cookieJar.push(cookiePart);
        }
      }

      const pageHtml = await pageRes.text();

      // Extract CSRF token from meta tag or hidden input
      let csrfToken = "";
      const metaMatch = pageHtml.match(/<meta\s+name="csrf-token"\s+content="([^"]+)"/);
      if (metaMatch) {
        csrfToken = metaMatch[1];
      } else {
        const inputMatch = pageHtml.match(/<input[^>]+name="_token"[^>]+value="([^"]+)"/);
        if (inputMatch) csrfToken = inputMatch[1];
      }

      console.log("Got CSRF token:", csrfToken ? "yes" : "no", "Cookies:", cookieJar.length);

      // Step 2: Make the API request with CSRF token and session cookies
      const formData = new URLSearchParams();
      formData.append("_token", csrfToken);
      formData.append("degree", degree);
      formData.append("year", year);
      formData.append("batch", batch);

      const apiRes = await fetch("https://timetable.sruniv.com/searchBatchReport2Public", {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
          "Cookie": cookieJar.join("; "),
          "User-Agent": "Mozilla/5.0",
          "X-Requested-With": "XMLHttpRequest",
          "Referer": "https://timetable.sruniv.com/batchReport",
        },
        body: formData.toString(),
      });

      console.log("API response status:", apiRes.status);
      const rawText = await apiRes.text();
      console.log("API raw response (first 300 chars):", rawText.substring(0, 300));

      if (apiRes.ok) {
        const data = JSON.parse(rawText);

        if (data.success && data.data && typeof data.data === "object") {
          // data.data is { "Monday": { "09:00-09:50": [...], ... }, ... }
          const classes: Record<string, Array<{
            time: string;
            subject: string;
            faculty: string;
            room: string;
            batch: string;
            semester: string;
            type: string;
            ltp: string;
          }>> = {};

          for (const [day, timeSlots] of Object.entries(data.data)) {
            classes[day] = [];
            if (typeof timeSlots === "object" && timeSlots !== null) {
              for (const [time, schedules] of Object.entries(timeSlots as Record<string, any>)) {
                if (Array.isArray(schedules)) {
                  for (const schedule of schedules) {
                    classes[day].push({
                      time,
                      subject: schedule.subject || "Unknown",
                      faculty: schedule.facultyName || "TBA",
                      room: schedule.room_name || "TBA",
                      batch: schedule.batch || batch,
                      semester: schedule.semester || "",
                      ltp: schedule.ltp || "",
                      type: inferType(schedule.ltp, schedule.subject),
                    });
                  }
                }
              }
            }
            classes[day].sort((a, b) => a.time.localeCompare(b.time));
          }

          return new Response(
            JSON.stringify({
              success: true,
              classes,
              degree: data.degree,
              year: data.year,
              source: "live",
            }),
            { headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }
      }
    } catch (fetchError) {
      console.log("College API error:", fetchError);
    }

    return new Response(
      JSON.stringify({ success: true, classes: {}, source: "unavailable" }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error:", error);
    return new Response(
      JSON.stringify({ success: false, error: "Internal error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});

function inferType(ltp: string | undefined, subject: string | undefined): string {
  if (!ltp && !subject) return "lecture";
  const ltpLower = (ltp || "").toLowerCase();
  const subLower = (subject || "").toLowerCase();
  if (subLower.includes("lab")) return "lab";
  if (ltpLower.includes("0-0-") || ltpLower.match(/\d+-\d+-[1-9]/)) return "lab";
  if (subLower.includes("tutorial")) return "tutorial";
  if (ltpLower.match(/\d+-[1-9]+-\d+/)) return "tutorial";
  return "lecture";
}
