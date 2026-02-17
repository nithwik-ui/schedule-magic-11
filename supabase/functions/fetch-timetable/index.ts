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
    const { degree, year, batch, day } = await req.json();

    if (!degree || !year || !batch) {
      return new Response(
        JSON.stringify({ success: false, error: "Missing parameters" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log(`Fetching timetable for ${degree}, Year ${year}, Batch ${batch}, ${day}`);

    // Try to fetch from the college timetable API
    // The college site uses POST requests to fetch timetable data
    try {
      const response = await fetch("https://timetable.sruniv.com/api/batchReport", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          degree,
          year: parseInt(year),
          batch,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        console.log("Got response from college API");

        // Parse and transform the data into our format
        if (data && Array.isArray(data)) {
          const dayData = data.filter((item: any) => item.day === day);
          const classes = dayData.map((item: any) => ({
            time: item.time || item.slot || "",
            subject: item.subject || item.courseName || "Unknown",
            faculty: item.faculty || item.teacherName || "TBA",
            room: item.room || item.venue || "TBA",
            type: (item.type || "lecture").toLowerCase(),
          }));

          return new Response(
            JSON.stringify({ success: true, classes, source: "live" }),
            { headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }
      }
    } catch (fetchError) {
      console.log("College API not available, returning empty:", fetchError);
    }

    // Return empty if college API is not available
    return new Response(
      JSON.stringify({ success: true, classes: [], source: "unavailable" }),
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
