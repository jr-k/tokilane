import React from 'react'
import { useTranslation, Language } from '@/lib/translations'
import { LanguageSwitcherContainer, LanguageButton, LanguageIcon, LanguageText } from './styled'

interface LanguageSwitcherProps {
  className?: string
}

const LanguageSwitcher: React.FC<LanguageSwitcherProps> = ({ className }) => {
  const { language, setLanguage } = useTranslation()

  const handleLanguageChange = (newLanguage: Language) => {
    if (newLanguage !== language) {
      setLanguage(newLanguage)
    }
  }

  return (
    <LanguageSwitcherContainer className={className}>
      <LanguageButton
        $active={language === 'en'}
        onClick={() => handleLanguageChange('en')}
        title="Switch to English"
      >
        <LanguageIcon>🇺🇸</LanguageIcon>
        <LanguageText>EN</LanguageText>
      </LanguageButton>

      <LanguageButton
        $active={language === 'fr'}
        onClick={() => handleLanguageChange('fr')}
        title="Passer en français"
      >
        <LanguageIcon>🇫🇷</LanguageIcon>
        <LanguageText>FR</LanguageText>
      </LanguageButton>
    </LanguageSwitcherContainer>
  )
}

export default LanguageSwitcher
