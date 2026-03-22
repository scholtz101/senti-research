import axios from 'axios';

const BASE = 'https://api.opencorporates.com/v0.4';

export async function search(query) {
  const results = [];
  try {
    const resp = await axios.get(`${BASE}/companies/search`, {
      params: { q: query, format: 'json', per_page: 10 },
      timeout: 8000,
      headers: { 'User-Agent': 'SentiResearch/1.0' }
    });
    const companies = resp.data?.results?.companies || [];
    for (const { company } of companies) {
      results.push({
        id: `oc_${company.company_number}_${company.jurisdiction_code}`,
        type: 'company',
        label: company.name,
        source: 'OpenCorporates',
        data: {
          name: company.name,
          jurisdiction: company.jurisdiction_code,
          companyNumber: company.company_number,
          companyType: company.company_type,
          status: company.current_status,
          incorporationDate: company.incorporation_date,
          registeredAddress: company.registered_address_in_full,
          url: company.opencorporates_url
        }
      });
    }
  } catch (e) {
    console.error('OpenCorporates error:', e.message);
  }
  return results;
}

export async function getDetails(jurisdictionCode, companyNumber) {
  try {
    const resp = await axios.get(`${BASE}/companies/${jurisdictionCode}/${companyNumber}`, {
      params: { format: 'json' },
      timeout: 8000,
      headers: { 'User-Agent': 'SentiResearch/1.0' }
    });
    const company = resp.data?.results?.company;
    if (!company) return null;

    const officers = (company.officers || []).map(o => ({
      id: `officer_${o.officer?.id || Math.random()}`,
      type: 'person',
      label: o.officer?.name,
      source: 'OpenCorporates',
      data: {
        name: o.officer?.name,
        position: o.officer?.position,
        startDate: o.officer?.start_date,
        endDate: o.officer?.end_date,
        inactive: o.officer?.inactive
      }
    }));

    return { officers };
  } catch (e) {
    console.error('OpenCorporates details error:', e.message);
    return null;
  }
}
