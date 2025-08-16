// src/components/Changelog.jsx
import { useTranslation } from "react-i18next";

const Changelog = () => {
  const { t } = useTranslation();
  const changelogEntries = t('changelog_entries', { returnObjects: true });

  return (
    <>
      <div className="px-4 max-w-3xl mx-auto">
        <h1 className="text-2xl font-bold mb-4">{t('changelog_title')}</h1>
        {changelogEntries.map((entry) => (
          <div key={entry.date} className="mb-6">
            <h2 className="text-lg font-semibold mb-2">{entry.date}</h2>
            <ul className="list-disc list-inside space-y-1">
              {entry.items.map((item, idx) => (
                <li key={idx}>{item}</li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </>
  );
};

export default Changelog;