import React from 'react';
import {
  COMMUNITY_PERMISSION_OPTIONS,
  CommunityPermission,
} from '../../community/types';
import * as styles from '../styles/permission-selector.css';

interface PermissionSelectorProps {
  value: CommunityPermission;
  onChange: (value: CommunityPermission) => void;
  disabled?: boolean;
}

export const PermissionSelector = ({ value, onChange, disabled = false }: PermissionSelectorProps) => {
  return (
    <div className={styles.permissionSelector}>
      <div className={styles.optionsContainer}>
        {COMMUNITY_PERMISSION_OPTIONS.map(option => (
          <div
            key={option.value}
            className={`${styles.permissionOption} ${
              value === option.value ? styles.selected : ''
            } ${disabled ? styles.disabled : ''}`}
            onClick={() => !disabled && onChange(option.value)}
          >
            <div className={styles.radioButton}>
              <div
                className={`${styles.radioInner} ${
                  value === option.value ? styles.radioSelected : ''
                }`}
              />
            </div>
            <div className={styles.optionContent}>
              <div className={styles.permissionLabel}>{option.label}</div>
              <div className={styles.permissionDescription}>{option.description}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
