export const config = {
    HEX_PROJECT_ID: '21c6c24a-60e8-487c-b03a-1f04dda4f918',
    HEX_API_TOKEN: '5b97b8d1945b14acc5c2faed5e314310438e038640df2ff475d357993d0217826b3db99144ebf236d189778cda42898e',
    API_BASE_URL: process.env.NODE_ENV === 'production' 
        ? 'https://visualiser-xhjh.onrender.com'
        : 'http://localhost:3000',
    NOTION_DATABASE_ID: process.env.NOTION_DATABASE_ID || "18730aa1-c7a9-8059-b53e-de31cde8bfc4",
    NOTION_API_KEY: process.env.NOTION_API_KEY || "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"
}; 