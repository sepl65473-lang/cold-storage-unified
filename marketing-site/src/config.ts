const rawDashboardUrl =
  import.meta.env.VITE_PLATFORM_DASHBOARD_URL || `https://${window.location.hostname}/panel`;

const normalizeDashboardLoginUrl = (url: string) => {
  const trimmedUrl = url.trim().replace(/\/+$/, '');

  if (trimmedUrl.includes('#/')) {
    return trimmedUrl;
  }

  if (/\/login$/i.test(trimmedUrl)) {
    return trimmedUrl;
  }

  return `${trimmedUrl}/#/login`;
};

export const config = {
  platformDashboardUrl: normalizeDashboardLoginUrl(rawDashboardUrl),
  contactFormEndpoint: import.meta.env.VITE_CONTACT_FORM_ENDPOINT || 'https://sobectvd0h.execute-api.ap-south-1.amazonaws.com/prod/contact',
  analyticsEnabled: import.meta.env.VITE_ANALYTICS_ENABLED === 'true',
};
