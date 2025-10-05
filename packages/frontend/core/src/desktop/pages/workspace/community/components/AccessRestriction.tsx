import { Button } from '@affine/component';
import type { CommunityDocument } from '../types';

interface AccessRestrictionProps {
  document: CommunityDocument;
  onPurchase?: () => void;
  onFollow?: () => void;
}

export const AccessRestriction = ({
  document,
  onPurchase,
  onFollow,
}: AccessRestrictionProps) => {
  // 需要关注
  if (document.needFollow) {
    return (
      <div style={{
        padding: '60px 40px',
        textAlign: 'center',
        backgroundColor: 'var(--affine-background-secondary-color)',
        border: '2px dashed var(--affine-border-color)',
        borderRadius: '12px',
        margin: '24px 0',
      }}>
        <div style={{
          fontSize: '48px',
          marginBottom: '16px',
        }}>
          🔒
        </div>
        <h3 style={{
          fontSize: '20px',
          fontWeight: 600,
          color: 'var(--affine-text-primary-color)',
          marginBottom: '12px',
        }}>
          需要关注作者后查看
        </h3>
        <p style={{
          fontSize: '14px',
          color: 'var(--affine-text-secondary-color)',
          marginBottom: '24px',
        }}>
          关注 <strong>{document.authorName}</strong> 以查看完整内容
        </p>
        <Button
          onClick={onFollow}
          variant="primary"
          size="large"
        >
          关注作者
        </Button>
      </div>
    );
  }

  // 需要购买
  if (document.needPurchase) {
    const displayPrice = document.discountPrice || document.price;
    const hasDiscount = document.discountPrice && document.discountPrice < document.price;

    return (
      <div style={{
        padding: '60px 40px',
        textAlign: 'center',
        backgroundColor: 'var(--affine-background-secondary-color)',
        border: '2px solid var(--affine-primary-color)',
        borderRadius: '12px',
        margin: '24px 0',
      }}>
        <div style={{
          fontSize: '48px',
          marginBottom: '16px',
        }}>
          💎
        </div>
        <h3 style={{
          fontSize: '20px',
          fontWeight: 600,
          color: 'var(--affine-text-primary-color)',
          marginBottom: '12px',
        }}>
          购买后查看完整内容
        </h3>
        <p style={{
          fontSize: '14px',
          color: 'var(--affine-text-secondary-color)',
          marginBottom: '24px',
        }}>
          您可以免费预览前 <strong>{document.previewLength || 200}</strong> 个字符
        </p>

        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '12px',
          marginBottom: '24px',
        }}>
          {hasDiscount && (
            <span style={{
              fontSize: '18px',
              color: 'var(--affine-text-secondary-color)',
              textDecoration: 'line-through',
            }}>
              ¥{document.price}
            </span>
          )}
          <span style={{
            fontSize: '32px',
            fontWeight: 700,
            color: 'var(--affine-primary-color)',
          }}>
            ¥{displayPrice}
          </span>
        </div>

        {hasDiscount && (
          <div style={{
            display: 'inline-block',
            padding: '4px 12px',
            backgroundColor: 'var(--affine-error-color)',
            color: 'white',
            fontSize: '12px',
            fontWeight: 600,
            borderRadius: '12px',
            marginBottom: '24px',
          }}>
            限时优惠
          </div>
        )}

        <div>
          <Button
            onClick={onPurchase}
            variant="primary"
            size="large"
          >
            立即购买
          </Button>
        </div>

        <p style={{
          fontSize: '12px',
          color: 'var(--affine-text-secondary-color)',
          marginTop: '16px',
        }}>
          购买后可永久访问完整内容
        </p>
      </div>
    );
  }

  return null;
};
