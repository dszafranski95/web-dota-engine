import React from 'react';
import styles from './SkillBar.module.css';

interface SkillBarProps {
  spellCooldowns: { [key: number]: number };
}

const SkillBar: React.FC<SkillBarProps> = ({ spellCooldowns }) => {
  const formatCooldown = (cooldown: number) => {
    return (cooldown / 1000).toFixed(1); // Konwersja na sekundy z jednym miejscem po przecinku
  };

  const maxCooldowns: { [key: number]: number } = {
    1: 0,
    2: 5000,
    3: 15000,
    4: 60000,
  };

  return (
    <div className={styles.skillBar}>
      {[1, 2, 3, 4].map((spellNumber) => {
        const cooldown = spellCooldowns[spellNumber];
        const maxCooldown = maxCooldowns[spellNumber];
        const isOnCooldown = cooldown > 0;

        // Obliczenie procentu pozostałego czasu odnowienia
        const cooldownPercentage = isOnCooldown ? (cooldown / maxCooldown) * 100 : 0;

        // Ścieżka do ikony czaru
        const spellIcons: { [key: number]: string } = {
          1: '/icons/fire.png',
          2: '/icons/ice.png',
          3: '/icons/lightning.png',
          4: '/icons/poison.png',
        };

        return (
          <div
            key={spellNumber}
            className={`${styles.skill} ${isOnCooldown ? styles.cooldown : ''}`}
            data-key={spellNumber}
          >
            <span>{spellNumber}</span>
            <img src={spellIcons[spellNumber]} alt={`Spell ${spellNumber}`} />
            {isOnCooldown && (
              <>
                <div
                  className={styles.cooldownOverlay}
                  style={{ animationDuration: `${maxCooldown}ms` }}
                ></div>
                <div className={styles.cooldownText}>
                  {formatCooldown(cooldown)}
                </div>
              </>
            )}
          </div>
        );
      })}
    </div>
  );
};

export default SkillBar;
