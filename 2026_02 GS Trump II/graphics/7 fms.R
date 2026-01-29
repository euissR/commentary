source("0 data.R")
needs(sf, lubridate, cartogram, foreach)

# fms ----------------------------------------------------------

fms <- read_excel("data/Data_GS US scrolly 2026.xlsx", sheet = "FMS 2017-25") %>%
  select(
    country = 1,
    region = 2,
    date = 3,
    value = 4
  ) %>%
  print()

fms %>%
  group_by(region, date) %>%
  reframe(value = sum(value)) %>%
  ggplot() +
  aes(date, value) +
  geom_col(aes(fill = ifelse(
    region == "Europe", euiss_teal(), euiss_teal(3)
  )), width = 1) +
  scale_fill_identity() +
  facet_wrap( ~ region, ncol = 1)

# fms by cat ----------------------------------------------------------

fms_cat <- read_excel("data/Data_GS US scrolly 2026.xlsx", sheet = "FMS 2025 by category") %>%
  rename(country = 1) %>%
  select(1:16) %>%
  pivot_longer(-country) %>%
  print()

fms_cat %>%
  ggplot() +
  aes(name, reorder(country, desc(country))) +
  geom_point(aes(col = name, size = value)) +
  scale_color_manual(values = pal_seq_g_euiss(15)) 

fms_cat_eu <- fms_cat %>% 
  euiss_left_join(euiss_gisco() %>% 
                    select(NAME_ENGL, ISO3_CODE, EU_STAT)) %>% 
  filter(EU_STAT == "T")

fms_cat_eu %>% 
  ggplot() +
  aes(name, reorder(country, desc(country))) +
  geom_point(aes(col = name, size = value)) +
  scale_color_manual(values = pal_seq_g_euiss(15)) 

fms_sf <- fms %>%
  # euiss_left_join() when working!!!
  # euissGeo::euiss_left_join(euissGeo::euiss_gisco(),
  # verbose = TRUE)
  left_join(euiss_gisco() %>%
              select(NAME_ENGL, ISO3_CODE),
            by = c("country" = "NAME_ENGL")) %>%
  st_as_sf() %>%
  # st_transform(3035) %>%
  print()

fms %>%
  filter(name != "Total") %>%
  filter(country == "Total") %>%
  # write_csv("web/fms_total.csv")
  # print()
  ggplot() +
  aes(date, value, fill = name) +
  geom_area()

fms %>%
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
  facet_wrap( ~ country) +
  theme(axis.text.y = element_blank())

fms %>%
  filter(name != "Total") %>%
  filter(country != "Total") %>%
  filter(date %in% c(dmy("01062024"), dmy("01092025"))) %>%
  # print()
  ggplot() +
  aes(date, value) +
  geom_line(aes(col = name, group = country)) +
  geom_text_euiss(data = . %>%
                    filter(date %in% c(dmy("01092025"))),
                  aes(label = country),
                  alpha = .5) +
  scale_x_date(expand = c(.2, .2)) +
  facet_wrap( ~ name)
