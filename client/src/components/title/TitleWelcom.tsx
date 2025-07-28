import { Title, Text } from "@mantine/core";
import * as classes from "./TitleWelcom.css";

interface TitleString {
    title: string
}

export function TitleWelcom({title}: TitleString) {
  return (
    <>
      <Title className={classes.title} ta="center" mt={100}>
        <Text
          inherit
          variant="gradient"
          component="span"
          gradient={{ from: "pink", to: "yellow" }}
        >
          {title}
        </Text>
      </Title>
    </>
  );
}