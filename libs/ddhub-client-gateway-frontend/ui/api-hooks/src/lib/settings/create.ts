import {
  useCertificateControllerSave,
  UploadCertificateBodyDto,
} from '@dsb-client-gateway/dsb-client-gateway-api-client';

export const useCertificateSave = () => {
  const { mutate, isLoading } = useCertificateControllerSave();

  const createConfigurationHandler = (
    data: UploadCertificateBodyDto,
    onSuccess: () => void,
    onError: () => void
  ) => {
    mutate({ data }, { onSuccess, onError });
  };

  return {
    createConfigurationHandler,
    mutate,
    isLoading,
  };
};
