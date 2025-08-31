import styled from 'styled-components'

export const CardContainer = styled.div`
  position: relative;
  background-color: rgba(255, 255, 255, 0.05);
  border-radius: ${({ theme }) => theme.borderRadius.xl};
  border: 1px solid rgba(255, 255, 255, 0.1);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
  cursor: pointer;
  overflow: hidden;
  transition: all ${({ theme }) => theme.transitions.normal};

  &:hover {
    box-shadow: 0 8px 24px rgba(255, 0, 80, 0.2);
    border-color: rgba(255, 0, 80, 0.3);
    transform: translateY(-2px);
  }

  &:focus {
    outline: none;
    box-shadow: 0 0 0 2px rgba(255, 0, 80, 0.5);
  }
`

export const ImageContainer = styled.div`
  position: relative;
  height: 12rem;
  background-color: rgba(255, 255, 255, 0.05);
  overflow: hidden;
`

export const ThumbnailImage = styled.img`
  width: 100%;
  height: 100%;
  object-fit: cover;
  transition: transform ${({ theme }) => theme.transitions.slow};

  ${CardContainer}:hover & {
    transform: scale(1.05);
  }
`

export const FallbackContainer = styled.div`
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  background-color: rgba(255, 255, 255, 0.03);

  &.hidden {
    display: none;
  }
`

export const FallbackIcon = styled.span`
  font-size: 2.5rem;
  margin-bottom: ${({ theme }) => theme.spacing[2]};
`

export const FallbackText = styled.span`
  font-size: 0.75rem;
  color: rgba(255, 255, 255, 0.6);
  font-weight: 500;
  text-transform: uppercase;
`

export const ExtensionBadge = styled.span`
  position: absolute;
  top: ${({ theme }) => theme.spacing[2]};
  left: ${({ theme }) => theme.spacing[2]};
  display: inline-flex;
  align-items: center;
  padding: ${({ theme }) => theme.spacing[1]} ${({ theme }) => theme.spacing[2]};
  font-size: 0.75rem;
  font-weight: 500;
  background: linear-gradient(45deg, #ff0050, #ff4081);
  color: white;
  border-radius: ${({ theme }) => theme.borderRadius.full};
`

export const PreviewBadge = styled.div`
  position: absolute;
  top: ${({ theme }) => theme.spacing[2]};
  right: ${({ theme }) => theme.spacing[2]};
  width: 1.5rem;
  height: 1.5rem;
  background: linear-gradient(45deg, #ff0050, #ff4081);
  border-radius: ${({ theme }) => theme.borderRadius.full};
  display: flex;
  align-items: center;
  justify-content: center;
`

export const PreviewIcon = styled.div`
  color: ${({ theme }) => theme.colors.white};
  display: flex;
  align-items: center;
  justify-content: center;
`

export const InfoContainer = styled.div`
  padding: ${({ theme }) => theme.spacing[4]};
`

export const FileName = styled.h3`
  font-size: 0.875rem;
  font-weight: 500;
  color: white;
  line-height: 1.4;
  margin-bottom: ${({ theme }) => theme.spacing[2]};
  overflow: hidden;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  transition: color ${({ theme }) => theme.transitions.normal};

  ${CardContainer}:hover & {
    color: #ff4081;
  }
`

export const FileDetails = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.spacing[2]};
`

export const SizeTime = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  font-size: 0.75rem;
  color: rgba(255, 255, 255, 0.7);
  font-weight: 500;
`

export const MimeType = styled.div`
  font-size: 0.75rem;
  color: rgba(255, 255, 255, 0.5);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
`

export const HoverOverlay = styled.div`
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: ${({ theme }) => theme.colors.primary[500]};
  opacity: 0;
  transition: opacity ${({ theme }) => theme.transitions.normal};
  pointer-events: none;

  ${CardContainer}:hover & {
    opacity: 0.05;
  }
`
