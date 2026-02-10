import {
  Body,
  Button,
  Container,
  Head,
  Heading,
  Html,
  Preview,
  Section,
  Tailwind,
  Text,
} from "@react-email/components";

interface MagicLinkEmailProps {
  householdName: string;
  magicLink: string;
}

export const MagicLinkEmail = ({
  householdName,
  magicLink,
}: MagicLinkEmailProps) => {
  const previewText = `Votre lien de connexion pour le mariage`;

  return (
    <Html>
      <Head />
      <Preview>{previewText}</Preview>
      <Tailwind>
        <Body className='bg-white my-auto mx-auto font-sans'>
          <Container className='border border-solid border-[#eaeaea] rounded my-[40px] mx-auto p-[20px] w-full max-w-[465px]'>
            <Heading className='text-black text-[24px] font-normal text-center p-0 my-[30px] mx-0'>
              Bienvenue, {householdName} !
            </Heading>
            <Text className='text-black text-[14px] leading-[24px]'>
              Vous avez été invité à accéder à l'espace invités de notre
              mariage.
            </Text>
            <Text className='text-black text-[14px] leading-[24px]'>
              Cliquez sur le lien ci-dessous pour confirmer votre présence et
              accéder aux informations pratiques.
            </Text>
            <Section className='text-center mt-[32px] mb-[32px]'>
              <Button
                className='bg-[#000000] rounded text-white text-[12px] font-semibold no-underline text-center px-5 py-3'
                href={magicLink}
              >
                Accéder à mon espace
              </Button>
            </Section>
            <Text className='text-black text-[14px] leading-[24px]'>
              ou copiez-collez ce lien : <br />
              <a
                href={magicLink}
                className='text-blue-600 no-underline'
              >
                {magicLink}
              </a>
            </Text>
          </Container>
        </Body>
      </Tailwind>
    </Html>
  );
};

export default MagicLinkEmail;
