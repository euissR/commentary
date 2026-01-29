source("0 data.R")
needs(sf, lubridate, cartogram, foreach)

# read ----------------------------------------------------------

forces <- read_excel("data/Data_GS US scrolly 2026.xlsx",
                     sheet = "forces in Europe",
                     range = "a2:r41") %>%
  rename(country = 1) %>%
  select(-2) %>%
  pivot_longer(-country) %>%
  # names() %>% print()
  # filter(!str_detect(name, "Total")) %>%
  # drop_na(value) %>%
  mutate(
    date = case_when(
      str_detect(name, "...10") ~ "01122024",
      str_detect(name, "...11") ~ "01062025",
      str_detect(name, "...12") ~ "01062025",
      str_detect(name, "...13") ~ "01062025",
      str_detect(name, "...14") ~ "01062025",
      str_detect(name, "...15") ~ "01092025",
      str_detect(name, "...16") ~ "01092025",
      str_detect(name, "...17") ~ "01092025",
      str_detect(name, "...18") ~ "01092025",
      str_detect(name, "...3") ~ "01062024",
      str_detect(name, "...4") ~ "01062024",
      str_detect(name, "...5") ~ "01062024",
      str_detect(name, "...6") ~ "01062024",
      str_detect(name, "...7") ~ "01122024",
      str_detect(name, "...8") ~ "01122024",
      str_detect(name, "...9") ~ "01122024",
      .default = NA
    ),
    date = dmy(date)
  ) %>%
  rowwise() %>%
  mutate(name = str_sub(name, 1, str_locate(name, "\\...")[[1]] - 1)) %>%
  ungroup() %>%
  print()

forces_sf <- forces %>%
  # euiss_left_join() when working!!!
  # euissGeo::euiss_left_join(euissGeo::euiss_gisco(),
  # verbose = TRUE)
  left_join(euiss_gisco() %>%
              select(NAME_ENGL, ISO3_CODE),
            by = c("country" = "NAME_ENGL")) %>%
  st_as_sf() %>%
  # st_transform(3035) %>%
  print()

forces %>%
  filter(name != "Total") %>%
  filter(country == "Total") %>%
  # write_csv("web/forces_total.csv")
  # print()
  ggplot() +
  aes(date, value, fill = name) +
  geom_area()

forces %>%
  filter(name != "Total") %>%
  filter(country != "Total") %>%
  # print()
  ggplot() +
  aes(date, value) +
  geom_area(aes(fill = name)) +
  geom_text_euiss(
    data = . %>%
      filter(date %in% c(dmy("01062024"), dmy("01092025"))) %>%
      group_by(date, country) %>%
      reframe(sum = sum(value)),
    aes(date, sum, label = sum)
  ) +
  facet_wrap(~ country) +
  theme(axis.text.y = element_blank())

forces %>%
  filter(name != "Total") %>%
  filter(country != "Total") %>%
  filter(date %in% c(dmy("01062024"), dmy("01092025"))) %>% 
  # print()
  ggplot() +
  aes(date, value) +
  geom_line(aes(col = name, group = country)) +
  geom_text_euiss(
    data = . %>%
      filter(date %in% c(dmy("01092025"))),
    aes(label = country),
    alpha = .5
  ) +
  scale_x_date(expand = c(.2, .2)) +
  facet_wrap(~ name) 

